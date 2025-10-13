const AppError = require('../utils/appError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof AppError && err.statusCode ? err.statusCode : err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const payload = { message };

  if (err.details) {
    payload.details = err.details;
  }

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;
