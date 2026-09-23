/** Auth controller — thin HTTP layer over `authService`. */
const { asyncHandler } = require('../utils/asyncHandler');
const authService = require('../services/authService');

// Log lines never include the raw identifier or any credential material.
const register = asyncHandler(async (req, res) => {
  console.log('[AUTH] Registration attempt received');
  const { user } = await authService.register(req.body || {});
  console.log('[AUTH] User registered successfully (id:', user.id + ')');
  res.status(201).json({ message: 'Registration successful', user });
});

const login = asyncHandler(async (req, res) => {
  console.log('[AUTH] Login attempt received');
  const { token, user } = await authService.login(req.body || {});
  console.log('[AUTH] Login successful (id:', user.id + ')');
  res.json({ token, user });
});

const me = asyncHandler(async (req, res) => {
  const { user } = await authService.getMe(req.user.id);
  res.json({ success: true, user });
});

module.exports = { register, login, me };