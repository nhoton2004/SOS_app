const mongoose = require('mongoose');
const mediaAssetSchema = require('./schemas/mediaAsset.schema');
const geoPointSchema = require('./schemas/geoPoint.schema');

const postStatus = ['PENDING', 'APPROVED', 'REJECTED'];

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    media: {
      type: [mediaAssetSchema],
      default: [],
    },
    status: {
      type: String,
      enum: postStatus,
      default: 'PENDING',
      index: true,
    },
    topics: {
      type: [String],
      default: [],
    },
    location: {
      type: geoPointSchema,
      default: null,
    },
    rejectedReason: {
      type: String,
      default: null,
      trim: true,
    },
    stats: {
      type: new mongoose.Schema(
        {
          like: { type: Number, default: 0, min: 0 },
          comment: { type: Number, default: 0, min: 0 },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'posts',
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ location: '2dsphere' }, { partialFilterExpression: { location: { $type: 'object' } } });

module.exports = mongoose.model('Post', postSchema);
