import { DataTypes, Model } from 'sequelize';
import { sequelize } from './db.js';

class Like extends Model {}

Like.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fromUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'from_user_id',
    },
    toUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'to_user_id',
    },
  },
  {
    sequelize,
    modelName: 'Like',
    tableName: 'likes',
    timestamps: true,
  },
);

export default Like;
