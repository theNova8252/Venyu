import { DataTypes, Model } from 'sequelize';
// eslint-disable-next-line import/no-cycle
import { sequelize } from './db.js';

class E2eeKey extends Model {}

E2eeKey.init(
  {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    publicKeyJwk: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'public_key_jwk',
    },
  },
  {
    sequelize,
    modelName: 'E2eeKey',
    tableName: 'e2ee_keys',
    timestamps: true,
  },
);

export default E2eeKey;
