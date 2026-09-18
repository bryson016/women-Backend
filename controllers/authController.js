/** Auth controller — thin HTTP layer over `authService`. */
const { asyncHandler } = require('../utils/asyncHandler');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  console.log('[AUTH] Registration attempt:', req.body && req.body.username);
  const { user } = await authService.register(req.body || {});
  console.log('[AUTH] User registered successfully:', user.username);
  res.status(201).json({ message: 'Registration successful', user });
});

const login = asyncHandler(async (req, res) => {
  console.log('[AUTH] Login attempt:', req.body && req.body.username);
  const { token, user } = await authService.login(req.body || {});
  console.log('[AUTH] Login successful:', user.username);
  res.json({ token, user });
});

const me = asyncHandler(async (req, res) => {
  const { user } = authService.getMe(req.user.id);
  res.json({ success: true, user });
});

module.exports = { register, login, me };