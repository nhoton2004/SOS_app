const mongoose = require('mongoose');

const sosChannelSchema = new mongoose.Schema(
  {
    sosId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SosCase',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: 'sos_channels',
  }
);

sosChannelSchema.index({ sosId: 1 }, { unique: true });

module.exports = mongoose.model('SosChannel', sosChannelSchema);
