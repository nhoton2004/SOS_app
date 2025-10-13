const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    usage: {
      type: String,
      enum: ['AVATAR', 'ID_CARD_FRONT', 'ID_CARD_BACK', 'POST_MEDIA', 'ORG_DOC', 'SOS_MEDIA', 'OTHER'],
      required: true,
      index: true,
    },
    bucket: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      min: 0,
      default: 0,
    },
    acl: {
      type: String,
      enum: ['private', 'public-read'],
      default: 'private',
    },
    etag: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'media_assets',
  }
);

mediaAssetSchema.index({ bucket: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);
