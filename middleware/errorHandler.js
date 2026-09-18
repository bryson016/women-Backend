/**
 * Centralized error handling — every API error returns predictable JSON:
 *   { "success": false, "message": "..." }
 * so requests never hang and clients never receive HTML error pages.
 */

// 404 for unknown API routes (mounted after all routers).
function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

// Final Express error middleware (must be last; 4 args).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);
  const status = err && Number.isInteger(err.status) ? err.status : 500;
  const message =
    status >= 500 ? 'Internal server error' : err.message || 'Request failed';
  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };