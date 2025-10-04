// models/volunteerProfile.model.js
const mongoose = require('mongoose');

// Dựa theo tài liệu thiết kế của bạn
const VolunteerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Đây là cách Mongoose biết trường này liên kết tới Model 'User'
            required: true,
            unique: true,
        },
        type: {
            type: String,
            enum: ['CN', 'TC'],
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        ready: {
            type: Boolean,
            default: false,
        },
        skills: {
            type: [String], // Ví dụ: ['SWIM', 'FIRST_AID']
        },
        homeBase: {
            location: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point',
                },
                coordinates: {
                    type: [Number], // [longitude, latitude]
                },
            },
            radiusKm: {
                type: Number,
                default: 5,
            },
        },
        reputation: {
            totalCases: { type: Number, default: 0 },
            ratingAvg: { type: Number, default: 0 },
            badges: [String],
        },
        // Các trường khác như idCardFront, organization... bạn có thể thêm tương tự
    },
    {
        timestamps: true,
    }
);

// Tạo index cho truy vấn vị trí
VolunteerProfileSchema.index({ 'homeBase.location': '2dsphere' });

const VolunteerProfile = mongoose.model('VolunteerProfile', VolunteerProfileSchema);

module.exports = VolunteerProfile;