// models/user.model.js
const mongoose = require('mongoose');

// Dựa theo tài liệu thiết kế của bạn
const MediaAssetSchema = new mongoose.Schema({
    bucket: { type: String, required: true },
    key: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    etag: { type: String },
}, { _id: false });

const UserSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Vui lòng nhập họ tên'],
        },
        phone: {
            type: String,
            required: [true, 'Vui lòng nhập số điện thoại'],
            unique: true, // Đảm bảo SĐT là duy nhất
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true, // Cho phép nhiều giá trị null nhưng giá trị đã có phải là duy nhất
            trim: true,
        },
        passwordHash: {
            type: String,
            required: [true, 'Mật khẩu là bắt buộc'],
        },
        roles: {
            type: [String],
            enum: ['USER', 'TNV_CN', 'TNV_TC', 'ADMIN'],
            required: true,
            default: ['USER'],
        },
        avatar: {
            type: MediaAssetSchema,
            default: null,
        },
        address: {
            line1: String,
            ward: String,
            district: String,
            province: String,
            country: String,
            location: {
                type: {
                    type: String,
                    enum: ['Point'],
                },
                coordinates: {
                    type: [Number], // [longitude, latitude]
                },
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Tự động thêm createdAt và updatedAt
    }
);

// Tạo index cho truy vấn vị trí
UserSchema.index({ 'address.location': '2dsphere' });

const User = mongoose.model('User', UserSchema);

module.exports = User;