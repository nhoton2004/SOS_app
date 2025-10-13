const jwt = require('jsonwebtoken');

const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return process.env.JWT_SECRET;
};

const signAccessToken = (payload, options = {}) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, getSecret(), { expiresIn, ...options });
};

const verifyToken = (token) => jwt.verify(token, getSecret());

module.exports = {
  signAccessToken,
  verifyToken,
};
