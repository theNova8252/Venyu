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
  },
  {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: true,
  },
);

export default ChatMessage;
