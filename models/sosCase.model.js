const mongoose = require('mongoose');
const geoPointSchema = require('./schemas/geoPoint.schema');

const sosStatus = ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

const sosCaseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
    },
    status: {
      type: String,
      enum: sosStatus,
      default: 'SEARCHING',
      index: true,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SosChannel',
      default: null,
    },
    meta: {
      radiusKmNotified: { type: Number, default: 0, min: 0 },
      notifyCount: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'sos_cases',
  }
);

sosCaseSchema.index({ code: 1 }, { unique: true });
sosCaseSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SosCase', sosCaseSchema);
