import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

function makeSequelize() {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    });
  }

  // Fallback: DB_* variables (local dev)
  return new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  });
}

export const sequelize = makeSequelize();

async function runPreMigration() {
  const qi = sequelize.getQueryInterface();

  // Helper: check if a table exists
  async function tableExists(name) {
    const tables = await qi.showAllTables();
    return tables.includes(name);
  }

  // Helper: get column type
  async function getColumnType(table, column) {
    try {
      const desc = await qi.describeTable(table);
      return desc[column]?.type ?? null;
    } catch {
      return null;
    }
  }

  // --- chat_messages: convert sender_id & read_by from VARCHAR to UUID ---
  if (await tableExists('chat_messages')) {
    const senderType = await getColumnType('chat_messages', 'sender_id');
    if (senderType && senderType.toUpperCase().includes('CHARACTER VARYING')) {
      console.log('Migrating chat_messages.sender_id VARCHAR → UUID...');
      // Remove orphan rows where sender_id isn't a valid UUID or doesn't exist in users
      await sequelize.query(`
        DELETE FROM chat_messages
        WHERE sender_id IS NULL
           OR sender_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           OR sender_id::uuid NOT IN (SELECT id FROM users)
      `).catch(() => {});
      await sequelize.query(`
        ALTER TABLE chat_messages ALTER COLUMN sender_id TYPE UUID USING sender_id::uuid
      `).catch(() => {});
    }

    const readByType = await getColumnType('chat_messages', 'read_by');
    if (readByType && readByType.toUpperCase().includes('CHARACTER VARYING')) {
      console.log('Migrating chat_messages.read_by VARCHAR → UUID...');
      await sequelize.query(`
        UPDATE chat_messages SET read_by = NULL
        WHERE read_by IS NOT NULL
          AND read_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      `).catch(() => {});
      await sequelize.query(`
        ALTER TABLE chat_messages ALTER COLUMN read_by TYPE UUID USING read_by::uuid
      `).catch(() => {});
    }
  }

  // --- Drop old columns from users table that moved to new tables ---
  if (await tableExists('users')) {
    const oldCols = ['access_token', 'refresh_token', 'token_expires_at', 'top_artists', 'top_tracks', 'recently_played', 'genres'];
    const desc = await qi.describeTable('users').catch(() => ({}));
    const colsToDrop = oldCols.filter((col) => desc[col]);
    await Promise.all(colsToDrop.map((col) => {
      console.log(`Dropping old users.${col} column...`);
      return qi.removeColumn('users', col).catch(() => {});
    }));
  }

  // --- event_rsvps: ensure proper column names ---
  if (await tableExists('event_rsvps')) {
    const desc = await qi.describeTable('event_rsvps').catch(() => ({}));

    // Rename camelCase → snake_case if old columns exist
    if (desc.userId && !desc.user_id) {
      console.log('Renaming event_rsvps.userId → user_id...');
      await sequelize.query('ALTER TABLE event_rsvps RENAME COLUMN "userId" TO user_id').catch(() => {});
    }
    if (desc.eventId && !desc.event_id) {
      console.log('Renaming event_rsvps.eventId → event_id...');
      await sequelize.query('ALTER TABLE event_rsvps RENAME COLUMN "eventId" TO event_id').catch(() => {});
    }

    // If required columns are completely missing, the existing rows are orphaned — truncate
    const descAfter = await qi.describeTable('event_rsvps').catch(() => ({}));
    if (!descAfter.user_id && !descAfter.userId) {
      console.log('event_rsvps missing user column — truncating orphan rows...');
      await sequelize.query('TRUNCATE TABLE event_rsvps RESTART IDENTITY CASCADE').catch(() => {});
    } else {
      // Clean orphan rows
      await sequelize.query('DELETE FROM event_rsvps WHERE user_id IS NULL OR event_id IS NULL').catch(() => {});
      await sequelize.query('DELETE FROM event_rsvps WHERE user_id NOT IN (SELECT id FROM users)').catch(() => {});
    }
  }
}

export async function initDb() {
  // Import all models so Sequelize knows about them, then wire associations
  // eslint-disable-next-line import/no-cycle
  const { setupAssociations } = await import('./index.js');
  setupAssociations();

  try {
    await sequelize.authenticate();

    // Pre-migration: convert existing VARCHAR columns to UUID where needed
    // This handles the transition from the old schema to the new one
    await runPreMigration();

    await sequelize.sync({ alter: true });
    console.log('DB connected & synced');
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }
}
