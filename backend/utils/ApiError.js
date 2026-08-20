// `isOperational = true` marks expected app-level errors (validation, 404,
// forbidden, conflict). Non-operational throws are treated as programmer
// errors: their real message is logged server-side but never returned to the
// client, which is how we satisfy "never expose stack traces / secrets" without
// every controller having to remember.
class ApiError extends Error {
  constructor(statusCode, message, { details, cause, isOperational = true } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    if (cause) this.cause = cause;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, { details });
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message, details) {
    return new ApiError(409, message, { details });
  }
  static unprocessable(message, details) {
    return new ApiError(422, message, { details });
  }
  static internal(message = 'Internal server error', cause) {
    return new ApiError(500, message, { cause, isOperational: false });
  }
}

module.exports = ApiError;