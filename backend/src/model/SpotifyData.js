import { DataTypes, Model } from 'sequelize';
// eslint-disable-next-line import/no-cycle
import { sequelize } from './db.js';

class SpotifyData extends Model {}

SpotifyData.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    topArtists: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'top_artists',
    },
    topTracks: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'top_tracks',
    },
    recentlyPlayed: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'recently_played',
    },
    genres: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      field: 'genres',
    },
  },
  {
    sequelize,
    modelName: 'SpotifyData',
    tableName: 'spotify_data',
    timestamps: true,
  },
);

export default SpotifyData;
