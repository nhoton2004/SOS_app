const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'skills_master',
  }
);

skillSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Skill', skillSchema);
