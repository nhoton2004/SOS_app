const mongoose = require('mongoose');

const responderStatus = ['NOTIFIED', 'SEEN', 'ACCEPTED', 'DECLINED', 'EXPIRED'];

const sosResponderQueueSchema = new mongoose.Schema(
  {
    sosId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SosCase',
      required: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    distanceKm: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: responderStatus,
      default: 'NOTIFIED',
      index: true,
    },
    notifiedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    declineReason: {
      type: String,
      default: null,
      trim: true,
    },
    declinedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'sos_responder_queue',
  }
);

sosResponderQueueSchema.index({ sosId: 1, volunteerId: 1 }, { unique: true });
sosResponderQueueSchema.index({ status: 1, notifiedAt: -1 });

module.exports = mongoose.model('SosResponderQueue', sosResponderQueueSchema);
