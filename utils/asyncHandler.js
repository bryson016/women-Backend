/**
 * Wraps async route handlers so rejected promises reach the centralized
 * Express error handler instead of leaving requests hanging.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Error with an explicit HTTP status for the centralized handler. */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { asyncHandler, ApiError };