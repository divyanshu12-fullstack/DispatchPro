const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, _next) {
  if (err && err.name === 'CastError') {
    err = new ApiError(400, `Invalid value for field "${err.path}"`);
  }

  if (err && err.name === 'ValidationError' && err.errors) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
    err = ApiError.unprocessable('Validation failed', details);
  }

  if (err && err.code === 11000) {
    const fields = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
    err = ApiError.conflict(`Duplicate value for ${fields}`);
  }

  if (!(err instanceof ApiError)) {
    console.error('[error] Unhandled error:', err);
    err = ApiError.internal('Internal server error', err);
  } else {
    console.warn(
      `[error] ${req.method} ${req.originalUrl} -> ${err.statusCode}: ${err.message}`
    );
  }

  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(err.details ? { details: err.details } : {}),
    ...(isDev && !err.isOperational ? { stack: err.stack } : {}),
  });
}

module.exports = errorMiddleware;