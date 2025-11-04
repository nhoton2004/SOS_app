const express = require('express');
const {
  createSosCase,
  acceptSosCase,
  cancelSosCase,
  declineSosCase,
  getSosCaseDetails,
  getSosCases,
  getDirections,
} = require('../controllers/sos.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Tất cả routes cần xác thực
router.use(authenticate);

// Tạo SOS case
router.post('/', createSosCase);

// Lấy danh sách cases (phải đặt trước route /:caseId)
router.get('/', getSosCases);

// Lấy Google Maps directions URL (phải đặt trước route /:caseId)
router.get('/:caseId/directions', getDirections);

// TNV chấp nhận case
router.post('/:caseId/accept', acceptSosCase);

// Hủy case
router.post('/:caseId/cancel', cancelSosCase);

// TNV từ chối case
router.post('/:caseId/decline', declineSosCase);

// Lấy chi tiết case (đặt cuối cùng vì match với mọi thứ)
router.get('/:caseId', getSosCaseDetails);

module.exports = router;
