import { DataTypes, Model } from 'sequelize';
import { sequelize } from './db.js';

class User extends Model {
  // Add a method to get safe user data for frontend
  toJSON() {
    const values = { ...this.get() };

    // Convert snake_case to camelCase for frontend
    return {
      id: values.id,
      spotifyId: values.spotifyId,
      displayName: values.displayName,
      display_name: values.displayName, // Keep both for compatibility
      email: values.email,
      avatarUrl: values.avatarUrl,
      avatar_url: values.avatarUrl, // Keep both for compatibility
      country: values.country,
      product: values.product,
      bio: values.bio,
      isVisible: values.isVisible,
      is_visible: values.isVisible, // Keep both for compatibility
      topArtists: values.topArtists,
      top_artists: values.topArtists, // Keep both for compatibility
      topTracks: values.topTracks,
      top_tracks: values.topTracks, // Keep both for compatibility
      genres: values.genres,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
    };
  }
}

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
