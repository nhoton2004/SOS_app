const express = require('express');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  deleteSosCase,
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Tất cả routes cần authentication và admin authorization
router.use(authenticate);
router.use(authorize('ADMIN'));

// Lấy danh sách users
router.get('/users', getUsers);

// Lấy chi tiết user
router.get('/users/:id', getUserById);

// Cập nhật user
router.put('/users/:id', updateUser);

// Xóa user (soft delete)
router.delete('/users/:id', deleteUser);

// Xóa SOS case (hard delete) - chỉ dành cho admin khi có lỗi
router.delete('/sos-cases/:caseId', deleteSosCase);

module.exports = router;

