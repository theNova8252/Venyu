import { DataTypes, Model } from 'sequelize';
// eslint-disable-next-line import/no-cycle
import { sequelize } from './db.js';

class ChatMessage extends Model {}

ChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'room_id',
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sender_id',
    },
    ciphertext: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    iv: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'aes-gcm-v1',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
    readBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'read_by',
    },
  },
  {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: true,
    indexes: [
      { fields: ['room_id'] },
      { fields: ['sender_id'] },
      { fields: ['createdAt'] },
      { fields: ['read_at'] },
    ],
  },
);

export default ChatMessage;
