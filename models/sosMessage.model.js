const mongoose = require('mongoose');
const mediaAssetSchema = require('./schemas/mediaAsset.schema');

const sosMessageSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SosChannel',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
    },
    media: {
      type: [mediaAssetSchema],
      default: [],
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'sos_messages',
  }
);

sosMessageSchema.index({ channelId: 1, sentAt: 1 });
sosMessageSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 30,
    partialFilterExpression: { deletedAt: { $type: 'date' } },
  }
);

module.exports = mongoose.model('SosMessage', sosMessageSchema);
