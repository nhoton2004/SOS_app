const mongoose = require('mongoose');

// GeoJSON Point schema, stored as [longitude, latitude]
const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: 'Coordinates must be an array of [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

module.exports = geoPointSchema;
