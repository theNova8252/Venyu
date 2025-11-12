import { DataTypes, Model } from 'sequelize';
import { sequelize } from './db.js';

class User extends Model {}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

    // von Spotify
    spotify_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    display_name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    avatar_url: { type: DataTypes.TEXT },
    country: { type: DataTypes.STRING(2) },
    product: { type: DataTypes.STRING }, // free | premium | etc.

    // Tokens (einfach gehalten – für Produktion ggf. verschlüsseln)
    access_token: { type: DataTypes.TEXT },
    refresh_token: { type: DataTypes.TEXT },
    token_expires_at: { type: DataTypes.DATE },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [{ unique: true, fields: ['spotify_id'] }],
  },
);

export default User;
