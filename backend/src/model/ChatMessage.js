import { DataTypes, Model } from 'sequelize';
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
      type: DataTypes.STRING,
      allowNull: false,
      field: 'sender_id',
    },
    ciphertext: {
      type: DataTypes.TEXT, // base64
      allowNull: false,
    },
    iv: {
      type: DataTypes.STRING, // base64
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'aes-gcm-v1',
    },

    // ✅ Read Receipt Speicherung (1:1 Chat)
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
    readBy: {
      type: DataTypes.STRING,
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
