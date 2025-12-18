import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';
import User from './User.js';

const EventRsvp = sequelize.define(
  'EventRsvp',
  {
    userId: { type: DataTypes.UUID, allowNull: false },
    eventId: { type: DataTypes.STRING, allowNull: false },
    interested: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    going: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'event_rsvps',
    indexes: [{ unique: true, fields: ['userId', 'eventId'] }, { fields: ['eventId'] }],
  },
);

EventRsvp.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

export default EventRsvp;
