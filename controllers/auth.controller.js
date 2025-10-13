const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const { signAccessToken } = require('../utils/jwt');
const { User } = require('../models');

const SALT_ROUNDS = 10;

const buildUserResponse = (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.passwordHash;
  return user;
};

const register = async (req, res, next) => {
  try {
    const { fullName, phone, email, password } = req.body;

    if (!fullName || !phone || !password) {
      throw new AppError('Full name, phone, and password are required', 400);
    }

    const normalizedPhone = phone.trim();
    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    const existingUser = await User.findOne({
      $or: [
        { phone: normalizedPhone },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    }).lean();

    if (existingUser) {
      throw new AppError('Account already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      fullName: fullName.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      passwordHash,
    });

    const token = signAccessToken({ sub: user._id.toString(), roles: user.roles });

    res.status(201).json({
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;
    if (!password) {
      throw new AppError('Password is required', 400);
    }

    const identifier = (phone || email || '').trim().toLowerCase();
    if (!identifier) {
      throw new AppError('Phone or email is required', 400);
    }

    const query = phone
      ? { phone: phone.trim() }
      : { email: identifier };

    const user = await User.findOne(query).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.isActive === false) {
      throw new AppError('Account is deactivated', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = signAccessToken({ sub: user._id.toString(), roles: user.roles });
    res.json({
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new AppError('Authentication required', 401);
    }

    const freshUser = await User.findById(req.user._id).lean();
    if (!freshUser) {
      throw new AppError('User not found', 404);
    }

    res.json({ user: buildUserResponse(freshUser) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
