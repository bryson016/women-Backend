/** Profile controller — operates only on the authenticated user's record. */
const { asyncHandler } = require('../utils/asyncHandler');
const userService = require('../services/userService');

const getProfile = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Profile request');
  res.json(userService.getProfile(req.authUser));
});

const updateProfile = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Update profile for:', req.user.username);
  res.json(await userService.updateProfile(req.authUser, req.body));
});

const changePassword = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Change password for:', req.user.username);
  const { currentPassword, newPassword } = req.body || {};
  res.json(await userService.changePassword(req.authUser, { currentPassword, newPassword }));
});

module.exports = { getProfile, updateProfile, changePassword };