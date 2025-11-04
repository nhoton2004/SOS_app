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
    emergencyType: {
      type: String,
      enum: ['MEDICAL', 'FIRE', 'ACCIDENT', 'CRIME', 'NATURAL_DISASTER', 'OTHER'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    manualAddress: {
      type: String,
      default: null,
      trim: true,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    responderLocation: {
      type: geoPointSchema,
      default: null,
    },
    responderInfo: {
      volunteerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      volunteerName: {
        type: String,
        default: null,
      },
      volunteerPhone: {
        type: String,
        default: null,
      },
      acceptedAt: {
        type: Date,
        default: null,
      },
      estimatedArrivalTime: {
        type: Date,
        default: null,
      },
    },
    trackingStatus: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED'],
      default: 'ACTIVE',
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
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    cancelledByRole: {
      type: String,
      enum: ['REPORTER', 'VOLUNTEER', 'ADMIN'],
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
sosCaseSchema.index({ responderLocation: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('SosCase', sosCaseSchema);
