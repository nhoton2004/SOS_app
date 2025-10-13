const mongoose = require('mongoose');

// Shared schema for media objects stored on S3
const mediaAssetSchema = new mongoose.Schema(
  {
    bucket: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number, min: 0 },
    acl: { type: String, enum: ['private', 'public-read'], default: 'private' },
    etag: { type: String },
  },
  { _id: false }
);

module.exports = mediaAssetSchema;
