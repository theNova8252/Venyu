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
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    ciphertext: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    iv: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    plaintext: {
      type: DataTypes.TEXT,
      allowNull: true,
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
      { fields: ['created_at'] },
      { fields: ['read_at'] },
    ],
  },
);

export default ChatMessage;
