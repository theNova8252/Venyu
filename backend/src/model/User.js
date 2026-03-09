import { DataTypes, Model } from 'sequelize';
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
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    spotifyId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'spotify_id',
    },
    displayName: {
      type: DataTypes.STRING,
      field: 'display_name',
    },
    email: {
      type: DataTypes.STRING,
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      field: 'avatar_url',
    },
    country: {
      type: DataTypes.STRING(2),
    },
    product: {
      type: DataTypes.STRING,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    age: {
      type: DataTypes.INTEGER,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_visible',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  },
);

export default User;
