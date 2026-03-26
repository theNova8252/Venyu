import { DataTypes, Model } from 'sequelize';
// eslint-disable-next-line import/no-cycle
import { sequelize } from './db.js';

class User extends Model {
  toJSON() {
    const values = { ...this.get() };
    // Never expose internal associations raw
    delete values.SpotifyToken;
    delete values.SpotifyData;
    return {
      id: values.id,
      spotifyId: values.spotifyId,
      // camelCase (JS convention)
      displayName: values.displayName,
      firstName: values.firstName,
      lastName: values.lastName,
      birthDate: values.birthDate,
      avatarUrl: values.avatarUrl,
      isVisible: values.isVisible,
      // snake_case aliases (frontend compatibility)
      display_name: values.displayName,
      first_name: values.firstName,
      last_name: values.lastName,
      birth_date: values.birthDate,
      avatar_url: values.avatarUrl,
      is_visible: values.isVisible,
      // plain fields
      email: values.email,
      country: values.country,
      product: values.product,
      bio: values.bio,
      age: values.age,
      latitude: values.latitude,
      longitude: values.longitude,
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
    displayName: { type: DataTypes.STRING, field: 'display_name' },
    firstName:   { type: DataTypes.STRING, field: 'first_name' },
    lastName:    { type: DataTypes.STRING, field: 'last_name' },
    birthDate:   { type: DataTypes.DATEONLY, field: 'birth_date' },
    email:       { type: DataTypes.STRING },
    avatarUrl:   { type: DataTypes.TEXT, field: 'avatar_url' },
    country:     { type: DataTypes.STRING(2) },
    product:     { type: DataTypes.STRING },
    bio:         { type: DataTypes.TEXT },
    age:         { type: DataTypes.INTEGER },
    isVisible:   { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_visible' },
    latitude:    { type: DataTypes.FLOAT, allowNull: true },
    longitude:   { type: DataTypes.FLOAT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  },
);

export default User;
