const AppError = require('../utils/appError');
const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const extractBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  return null;
};

const authenticate = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const payload = verifyToken(token);
    const userId = payload.sub || payload.id;
    const user = await User.findById(userId).lean();

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (user.isActive === false) {
      throw new AppError('Account is deactivated', 403);
    }

    req.user = user;
    req.auth = { token, payload };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (allowedRoles.length === 0) {
      return next();
    }

    const userRoles = req.user.roles || [];
    const isAllowed = allowedRoles.some((role) => userRoles.includes(role));
    if (!isAllowed) {
      return next(new AppError('Forbidden', 403));
    }

    return next();
  };

module.exports = {
  authenticate,
  authorize,
};
