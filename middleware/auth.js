/**
 * Authentication + role-based authorization.
 *
 * - `authenticateToken` validates the Bearer JWT, loads the user, and attaches
 *   a sanitized `req.user` (never includes password material).
 * - `requireRole(...roles)` enforces server-side role permissions so a client
 *   can never escalate by modifying the mobile app.
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../prisma/client');

const PUBLIC_USER_FIELDS = ['id', 'username', 'fullName', 'role', 'createdAt'];

function sanitizeUser(user) {
  if (!user) return null;
  const out = {};
  PUBLIC_USER_FIELDS.forEach((field) => {
    if (user[field] !== undefined) out[field] = user[field];
  });
  return out;
}

async function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    req.user = sanitizeUser(user);
    req.authUser = user; // internal record for services; never serialize it
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
}

function requireRole(...roles) {
  const allowed = roles.flat().map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
    const role = String(req.user.role || '').toLowerCase();
    if (!allowed.includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not have permission.' });
    }
    return next();
  };
}

module.exports = { authenticateToken, requireRole, sanitizeUser };