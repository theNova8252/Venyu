/**
 * Central model registry – imports every model and wires up associations.
 * Other files should import models from here (or directly from their files).
 * Call setupAssociations() once before sequelize.sync().
 */
/* eslint-disable import/no-cycle */
import User from './User.js';
import SpotifyToken from './SpotifyToken.js';
import SpotifyData from './SpotifyData.js';
import ChatMessage from './ChatMessage.js';
import E2eeKey from './e2eeKey.js';
import Like from './Like.js';
import EventRsvp from './eventRSVP.js';

let associationsSetup = false;

export function setupAssociations() {
  if (associationsSetup) return;
  associationsSetup = true;

  // ── User 1:1 SpotifyToken ──
  User.hasOne(SpotifyToken, { foreignKey: 'userId', as: 'spotifyToken', onDelete: 'CASCADE' });
  SpotifyToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // ── User 1:1 SpotifyData ──
  User.hasOne(SpotifyData, { foreignKey: 'userId', as: 'spotifyData', onDelete: 'CASCADE' });
  SpotifyData.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // ── User 1:1 E2eeKey ──
  User.hasOne(E2eeKey, { foreignKey: 'userId', as: 'e2eeKey', onDelete: 'CASCADE' });
  E2eeKey.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // ── User 1:N ChatMessage (sender) ──
  User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
  ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

  // ── User 1:N Like (from / to) ──
  User.hasMany(Like, { foreignKey: 'fromUserId', as: 'sentLikes', onDelete: 'CASCADE' });
  User.hasMany(Like, { foreignKey: 'toUserId', as: 'receivedLikes', onDelete: 'CASCADE' });
  Like.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });
  Like.belongsTo(User, { foreignKey: 'toUserId', as: 'toUser' });

  // ── User 1:N EventRsvp ──
  User.hasMany(EventRsvp, { foreignKey: 'userId', as: 'eventRsvps', onDelete: 'CASCADE' });
  EventRsvp.belongsTo(User, { foreignKey: 'userId', as: 'user' });
}

export { User, SpotifyToken, SpotifyData, ChatMessage, E2eeKey, Like, EventRsvp };
