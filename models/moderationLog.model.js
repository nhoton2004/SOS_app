const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    collection: { type: String, required: true, trim: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false, suppressReservedKeysWarning: true }
);

const moderationLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: subjectSchema,
      required: true,
    },
    action: {
      type: String,
      enum: ['APPROVE', 'REJECT', 'FLAG', 'UNFLAG'],
      required: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'moderation_logs',
    suppressReservedKeysWarning: true,
  }
);

moderationLogSchema.index({ 'subject.collection': 1, 'subject.id': 1 });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
