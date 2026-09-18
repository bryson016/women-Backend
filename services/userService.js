/**
 * Profile service — reads/updates the authenticated citizen's own record.
 * Only whitelisted fields are persisted; role/identity fields can never be
 * changed through this endpoint.
 */
const bcrypt = require('bcryptjs');
const config = require('../config');
const { sanitizeUser } = require('../middleware/auth');
const { ApiError } = require('../utils/asyncHandler');

const PROFILE_FIELDS = [
  'fullName',
  'phoneNumber',
  'email',
  'ward',
  'dateOfBirth',
  'gender',
  'idDocumentType',
  'idNumber',
  'disabilityStatus',
  'residency',
  'occupation',
  'village',
  'subLocation',
  'physicalAddress',
  'emergencyContact',
];

function toCitizen(user) {
  const nameParts = String(user.fullName || '').trim().split(/\s+/).filter(Boolean);
  const citizen = { id: user.id };
  citizen.firstName = nameParts[0] || '';
  citizen.lastName = nameParts.slice(1).join(' ') || '';
  PROFILE_FIELDS.forEach((field) => {
    if (field === 'fullName') return;
    citizen[field] = user[field] || '';
  });
  return citizen;
}

function getProfile(authUser) {
  return {
    user: {
      id: authUser.id,
      username: authUser.username,
      fullName: authUser.fullName,
      role: authUser.role,
    },
    citizen: toCitizen(authUser),
  };
}

function updateProfile(authUser, body) {
  const updates = body && typeof body === 'object' ? body : {};
  PROFILE_FIELDS.forEach((field) => {
    if (updates[field] !== undefined) {
      authUser[field] = updates[field];
    }
  });
  return {
    message: 'Profile updated successfully',
    user: sanitizeUser(authUser),
  };
}

async function changePassword(authUser, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required');
  }
  const ok = await bcrypt.compare(String(currentPassword), authUser.passwordHash || '');
  if (!ok) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  authUser.passwordHash = await bcrypt.hash(String(newPassword), config.bcryptRounds);
  return { message: 'Password changed successfully' };
}

module.exports = { getProfile, updateProfile, changePassword };