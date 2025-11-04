const { User } = require('../models');
const { SosCase } = require('../models');
const { SosResponderQueue } = require('../models');
const AppError = require('../utils/appError');

// Lấy danh sách users
const getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Filter theo status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'suspended') {
      query.isActive = false;
    }

    // Filter theo role
    if (role) {
      query.roles = role;
    }

    // Search theo tên hoặc phone
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-passwordHash')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết user
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-passwordHash').lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, roles } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Cập nhật isActive nếu có
    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    // Cập nhật roles nếu có
    if (roles && Array.isArray(roles)) {
      // Validate roles
      const validRoles = ['USER', 'TNV_CN', 'TNV_TC', 'ADMIN'];
      const invalidRoles = roles.filter((role) => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        throw new AppError(`Invalid roles: ${invalidRoles.join(', ')}`, 400);
      }
      if (roles.length === 0) {
        throw new AppError('At least one role must be assigned', 400);
      }
      user.roles = roles;
    }

    await user.save();

    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.passwordHash;

    res.json({
      success: true,
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// Xóa user (soft delete)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete: set isActive = false
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Xóa SOS case (hard delete) - chỉ dành cho admin khi có lỗi
const deleteSosCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    // Tìm case - có thể dùng _id hoặc code
    let sosCase = null;
    
    // Thử tìm bằng code trước
    if (caseId && typeof caseId === 'string' && caseId.startsWith('SOS')) {
      sosCase = await SosCase.findOne({ code: caseId });
    }
    
    // Nếu không tìm thấy, thử tìm bằng _id
    if (!sosCase) {
      try {
        sosCase = await SosCase.findById(caseId);
      } catch (error) {
        // Invalid ObjectId format
      }
    }

    if (!sosCase) {
      throw new AppError('SOS case not found', 404);
    }

    // Xóa tất cả queue items liên quan
    await SosResponderQueue.deleteMany({ sosId: sosCase._id });

    // Xóa case (hard delete)
    await SosCase.deleteOne({ _id: sosCase._id });

    res.json({
      success: true,
      message: 'SOS case deleted successfully',
      data: {
        deletedCaseId: sosCase._id,
        deletedCaseCode: sosCase.code,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  deleteSosCase,
};

