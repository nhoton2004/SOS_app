const mongoose = require('mongoose');
const geoPointSchema = require('./schemas/geoPoint.schema');

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['ANDROID', 'IOS'],
      required: true,
    },
    pushToken: {
      type: String,
      required: true,
      trim: true,
    },
    lastLocation: {
      type: geoPointSchema,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'devices',
  }
);

deviceSchema.index({ userId: 1, pushToken: 1 }, { unique: true });
deviceSchema.index({ lastLocation: '2dsphere' }, { partialFilterExpression: { lastLocation: { $type: 'object' } } });

module.exports = mongoose.model('Device', deviceSchema);
