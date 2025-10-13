const mongoose = require('mongoose');
const mediaAssetSchema = require('./schemas/mediaAsset.schema');
const geoPointSchema = require('./schemas/geoPoint.schema');

const roleEnum = ['USER', 'TNV_CN', 'TNV_TC', 'ADMIN'];

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    ward: { type: String, trim: true },
    district: { type: String, trim: true },
    province: { type: String, trim: true },
    country: { type: String, trim: true },
    location: {
      type: geoPointSchema,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    roles: {
      type: [String],
      enum: roleEnum,
      default: ['USER'],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one role must be assigned',
      },
    },
    avatar: {
      type: mediaAssetSchema,
      default: null,
    },
    address: {
      type: addressSchema,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ 'address.location': '2dsphere' });

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ getters: true });
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
