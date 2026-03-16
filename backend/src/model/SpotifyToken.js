import { DataTypes, Model } from 'sequelize';
// eslint-disable-next-line import/no-cycle
import { sequelize } from './db.js';

class SpotifyToken extends Model {}

SpotifyToken.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: 'user_id',
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'access_token',
    },
    refreshToken: {
      type: DataTypes.TEXT,
      field: 'refresh_token',
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      field: 'token_expires_at',
    },
  },
  {
    sequelize,
    modelName: 'SpotifyToken',
    tableName: 'spotify_tokens',
    timestamps: true,
  },
);

export default SpotifyToken;
