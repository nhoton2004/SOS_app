const mongoose = require('mongoose');
const mediaAssetSchema = require('./schemas/mediaAsset.schema');
const geoPointSchema = require('./schemas/geoPoint.schema');

const volunteerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['CN', 'TC'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    ready: {
      type: Boolean,
      default: false,
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    idCardFront: {
      type: mediaAssetSchema,
      default: null,
    },
    idCardBack: {
      type: mediaAssetSchema,
      default: null,
    },
    organization: {
      type: new mongoose.Schema(
        {
          name: { type: String, trim: true },
          address: { type: String, trim: true },
          contactPhone: { type: String, trim: true },
          legalDoc: { type: mediaAssetSchema, default: null },
        },
        { _id: false }
      ),
      default: null,
    },
    homeBase: {
      type: new mongoose.Schema(
        {
          location: { type: geoPointSchema, required: true },
          radiusKm: { type: Number, default: 5, min: 0 },
        },
        { _id: false }
      ),
      required: true,
    },
    reputation: {
      type: new mongoose.Schema(
        {
          totalCases: { type: Number, default: 0, min: 0 },
          ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
          badges: { type: [String], default: [] },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    reviewNotes: {
      type: String,
      default: null,
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

volunteerProfileSchema.index({ 'homeBase.location': '2dsphere' });

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
