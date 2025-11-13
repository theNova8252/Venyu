import { DataTypes, Model } from 'sequelize';
import { sequelize } from './db.js';

class User extends Model {}
User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    spotifyId: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'spotify_id' },
    displayName: { type: DataTypes.STRING, field: 'display_name' },
    email: { type: DataTypes.STRING },
    avatarUrl: { type: DataTypes.TEXT, field: 'avatar_url' },
    country: { type: DataTypes.STRING(2) },
    product: { type: DataTypes.STRING },
    accessToken: { type: DataTypes.TEXT, field: 'access_token' },
    refreshToken: { type: DataTypes.TEXT, field: 'refresh_token' },
    tokenExpiresAt: { type: DataTypes.DATE, field: 'token_expires_at' },
    bio: { type: DataTypes.TEXT },
    isVisible: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_visible' },
    topArtists: { type: DataTypes.JSONB, field: 'top_artists' },
    topTracks: { type: DataTypes.JSONB, field: 'top_tracks' },
    genres: { type: DataTypes.ARRAY(DataTypes.STRING), field: 'genres' },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  },
);
export default User;
