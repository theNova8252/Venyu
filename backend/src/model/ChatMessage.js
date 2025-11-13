// src/model/ChatMessage.js
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
      // Identifiziert einen Chat-Room, z.B. "user-3" oder eine Match-ID
      type: DataTypes.STRING,
      allowNull: false,
      field: 'room_id',
    },
    senderId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'sender_id',
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: true,
  },
);

export default ChatMessage;
