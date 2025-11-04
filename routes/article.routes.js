const express = require('express');
const {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  toggleLike,
  deleteArticle,
  uploadImage,
  approveArticle,
  rejectArticle,
} = require('../controllers/article.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../config/s3');

const router = express.Router();

// Public routes
router.get('/', getArticles);
router.get('/:id', getArticleById);

// Protected routes - cần xác thực
router.use(authenticate);

// Upload hình ảnh riêng lẻ
router.post('/upload-image', upload.single('image'), handleUploadError, uploadImage);

// Tạo bài viết mới - chỉ admin, tnv_cn, tnv_tc
router.post('/', (req, res, next) => {
  const allowedRoles = ['ADMIN', 'TNV_CN', 'TNV_TC'];
  const userRoles = req.user.roles || [];
  
  const hasPermission = userRoles.some(role => allowedRoles.includes(role));
  
  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only ADMIN, TNV_CN, TNV_TC can create articles'
    });
  }
  
  next();
}, upload.single('image'), handleUploadError, createArticle);

// Cập nhật bài viết - cần auth
router.put('/:id', upload.single('image'), handleUploadError, updateArticle);

// Xóa bài viết - cần auth
router.delete('/:id', deleteArticle);

// Thích/bỏ thích bài viết - tất cả user đã đăng nhập
router.post('/:id/like', toggleLike);

// Duyệt/từ chối bài viết - chỉ admin
router.post('/:id/approve', authorize('ADMIN'), approveArticle);
router.post('/:id/reject', authorize('ADMIN'), rejectArticle);

module.exports = router;
