import { DataTypes, Model } from 'sequelize';
// eslint-disable-next-line import/no-cycle
import { sequelize } from './db.js';

class User extends Model {
  toJSON() {
    const values = { ...this.get() };
    // Never expose tokens or internal associations raw
    delete values.SpotifyToken;
    delete values.SpotifyData;
    return {
      id: values.id,
      spotifyId: values.spotifyId,
      displayName: values.displayName,
      display_name: values.displayName, // Keep both for compatibility
      firstName: values.firstName,
      first_name: values.firstName, // Keep both for compatibility
      lastName: values.lastName,
      last_name: values.lastName, // Keep both for compatibility
      birthDate: values.birthDate,
      birth_date: values.birthDate, // Keep both for compatibility
      email: values.email,
      avatarUrl: values.avatarUrl,
      country: values.country,
      product: values.product,
      bio: values.bio,
      age: values.age,
      isVisible: values.isVisible,
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
    firstName: { type: DataTypes.STRING, field: 'first_name' },
    lastName: { type: DataTypes.STRING, field: 'last_name' },
    birthDate: { type: DataTypes.DATEONLY, field: 'birth_date' },
    email: { type: DataTypes.STRING },
    avatarUrl: { type: DataTypes.TEXT, field: 'avatar_url' },
    country: { type: DataTypes.STRING(2) },
    product: { type: DataTypes.STRING },
    accessToken: { type: DataTypes.TEXT, field: 'access_token' },
    refreshToken: { type: DataTypes.TEXT, field: 'refresh_token' },
    tokenExpiresAt: { type: DataTypes.DATE, field: 'token_expires_at' },
    bio: { type: DataTypes.TEXT },
    age: { type: DataTypes.INTEGER },
    isVisible: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_visible' },
    topArtists: { type: DataTypes.JSONB, field: 'top_artists' },
    topTracks: { type: DataTypes.JSONB, field: 'top_tracks' },
    recentlyPlayed: { type: DataTypes.JSONB, field: 'recently_played' },
    genres: { type: DataTypes.ARRAY(DataTypes.STRING), field: 'genres' },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  },
);

export default User;
