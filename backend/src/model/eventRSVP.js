import { DataTypes, Model } from 'sequelize';
import { sequelize } from './db.js';

class EventRsvp extends Model {}

EventRsvp.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'event_id',
    },
    interested: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    going: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'EventRsvp',
    tableName: 'event_rsvps',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id', 'event_id'] },
      { fields: ['event_id'] },
    ],
  },
);

export default EventRsvp;
