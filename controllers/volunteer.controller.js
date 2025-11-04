const { VolunteerProfile, User } = require('../models');
const AppError = require('../utils/appError');

// Lấy danh sách volunteers
const getVolunteers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Filter theo status
    if (status) {
      query.status = status;
    }

    // Filter theo type
    if (type) {
      query.type = type;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const volunteers = await VolunteerProfile.find(query)
      .populate('userId', 'fullName phone email avatar roles isActive')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await VolunteerProfile.countDocuments(query);

    res.json({
      success: true,
      data: volunteers,
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

// Lấy chi tiết volunteer
const getVolunteerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const volunteer = await VolunteerProfile.findById(id)
      .populate('userId', 'fullName phone email avatar roles isActive')
      .lean();

    if (!volunteer) {
      throw new AppError('Volunteer not found', 404);
    }

    res.json({
      success: true,
      data: volunteer,
    });
  } catch (error) {
    next(error);
  }
};

// Phê duyệt volunteer
const approveVolunteer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const volunteer = await VolunteerProfile.findById(id);
    if (!volunteer) {
      throw new AppError('Volunteer not found', 404);
    }

    if (volunteer.status === 'APPROVED') {
      throw new AppError('Volunteer is already approved', 400);
    }

    // Cập nhật volunteer profile
    volunteer.status = 'APPROVED';
    volunteer.approvedAt = new Date();
    volunteer.ready = true;
    await volunteer.save();

    // Cập nhật User roles
    const user = await User.findById(volunteer.userId);
    if (user) {
      // Thêm role TNV_CN hoặc TNV_TC dựa trên volunteer type
      const volunteerRole = volunteer.type === 'CN' ? 'TNV_CN' : 'TNV_TC';
      if (!user.roles.includes(volunteerRole)) {
        user.roles.push(volunteerRole);
        await user.save();
      }
    }

    const volunteerObj = await VolunteerProfile.findById(id)
      .populate('userId', 'fullName phone email avatar roles isActive')
      .lean();

    res.json({
      success: true,
      data: volunteerObj,
      message: 'Volunteer approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Từ chối volunteer
const rejectVolunteer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;

    if (!reviewNotes) {
      throw new AppError('Review notes are required', 400);
    }

    const volunteer = await VolunteerProfile.findById(id);
    if (!volunteer) {
      throw new AppError('Volunteer not found', 404);
    }

    if (volunteer.status === 'REJECTED') {
      throw new AppError('Volunteer is already rejected', 400);
    }

    // Cập nhật volunteer profile
    volunteer.status = 'REJECTED';
    volunteer.reviewNotes = reviewNotes;
    volunteer.ready = false;
    await volunteer.save();

    const volunteerObj = await VolunteerProfile.findById(id)
      .populate('userId', 'fullName phone email avatar roles isActive')
      .lean();

    res.json({
      success: true,
      data: volunteerObj,
      message: 'Volunteer rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật volunteer profile
const updateVolunteer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ready, skills, reviewNotes } = req.body;

    const volunteer = await VolunteerProfile.findById(id);
    if (!volunteer) {
      throw new AppError('Volunteer not found', 404);
    }

    // Cập nhật ready status
    if (ready !== undefined) {
      volunteer.ready = ready;
    }

    // Cập nhật skills
    if (skills && Array.isArray(skills)) {
      volunteer.skills = skills;
    }

    // Cập nhật review notes
    if (reviewNotes !== undefined) {
      volunteer.reviewNotes = reviewNotes;
    }

    await volunteer.save();

    const volunteerObj = await VolunteerProfile.findById(id)
      .populate('userId', 'fullName phone email avatar roles isActive')
      .lean();

    res.json({
      success: true,
      data: volunteerObj,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVolunteers,
  getVolunteerById,
  approveVolunteer,
  rejectVolunteer,
  updateVolunteer,
};

