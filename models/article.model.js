const mongoose = require('mongoose');
const mediaAssetSchema = require('./schemas/mediaAsset.schema');

const articleSchema = new mongoose.Schema(
  {
    // Tiêu đề bài viết
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    
    // Nội dung bài viết
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    
    // Hình ảnh bài viết (chỉ 1 hình)
    images: {
      type: mediaAssetSchema,
      default: null,
    },
    
    // Tác giả bài viết
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Tên tác giả (để hiển thị nhanh, tránh populate)
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Thống kê lượt thích
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Danh sách người dùng đã thích bài viết
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    
    // Thời gian xuất bản (khác với createdAt)
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    
    // Thời gian chỉnh sửa cuối cùng
    lastEditedAt: {
      type: Date,
      default: null,
    },
    
    // Phân loại bài viết
    category: {
      type: String,
      enum: ['BLOG', 'COMMUNITY'],
      default: 'BLOG',
      index: true,
    },
    
    // Trạng thái bài viết
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    
    // Lý do từ chối (cho community posts)
    rejectedReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
    versionKey: false,
    collection: 'articles',
  }
);

// Indexes để tối ưu truy vấn
articleSchema.index({ createdAt: -1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ author: 1, createdAt: -1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ status: 1, createdAt: -1 });

// Virtual để kiểm tra user hiện tại có thích bài viết không
articleSchema.virtual('isLikedByCurrentUser').get(function() {
  // Virtual này sẽ được set trong controller khi có user context
  return this._isLikedByCurrentUser || false;
});

// Method để thêm/bỏ thích
articleSchema.methods.toggleLike = async function(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isLiked = this.likedBy.includes(userObjectId);
  
  if (isLiked) {
    // Bỏ thích
    this.likedBy.pull(userObjectId);
    this.likeCount = Math.max(0, this.likeCount - 1);
  } else {
    // Thêm thích
    this.likedBy.addToSet(userObjectId);
    this.likeCount += 1;
  }
  
  await this.save();
  return !isLiked; // Trả về trạng thái mới (true = đã thích, false = chưa thích)
};

// Method để kiểm tra user có thích bài viết không
articleSchema.methods.isLikedBy = function(userId) {
  if (!userId) return false;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return this.likedBy.includes(userObjectId);
};

// Pre-save middleware để cập nhật lastEditedAt
articleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastEditedAt = new Date();
  }
  next();
});

// Pre-save middleware để cập nhật authorName
articleSchema.pre('save', async function(next) {
  if (this.isNew && this.author && !this.authorName) {
    try {
      const User = mongoose.model('User');
      const author = await User.findById(this.author).select('fullName');
      if (author) {
        this.authorName = author.fullName;
      }
    } catch (error) {
      // Nếu không lấy được tên tác giả, dùng giá trị mặc định
      this.authorName = 'Unknown Author';
    }
  }
  next();
});

module.exports = mongoose.model('Article', articleSchema);
