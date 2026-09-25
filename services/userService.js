/**
 * Profile service — reads/updates the authenticated citizen's own record.
 * Only whitelisted fields are persisted; role/identity fields can never be
 * changed through this endpoint.
 */
const bcrypt = require('bcryptjs');
const config = require('../config');
const { prisma } = require('../prisma/client');
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
  const safeUser = sanitizeUser(authUser) || {};
  return {
    user: {
      ...safeUser,
      fullName: authUser.fullName || '',
      dateOfBirth: authUser.dateOfBirth || null,
      gender: authUser.gender || null,
      idDocumentType: authUser.idDocumentType || null,
      idNumber: authUser.idNumber || null,
      disabilityStatus: authUser.disabilityStatus || null,
      residency: authUser.residency || null,
      occupation: authUser.occupation || null,
      village: authUser.village || null,
      subLocation: authUser.subLocation || null,
      physicalAddress: authUser.physicalAddress || null,
      emergencyContact: authUser.emergencyContact || null,
    },
    citizen: toCitizen(authUser),
  };
}

async function updateProfile(authUser, body) {
  const updates = body && typeof body === 'object' ? body : {};
  const data = {};
  PROFILE_FIELDS.forEach((field) => {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  });
  if (Object.keys(data).length === 0) {
    return {
      message: 'No changes provided',
      user: sanitizeUser(authUser),
    };
  }
  const updatedUser = await prisma.user.update({
    where: { id: authUser.id },
    data,
  });
  return {
    message: 'Profile updated successfully',
    user: sanitizeUser(updatedUser),
  };
}

async function changePassword(authUser, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required');
  }
  // Fetch fresh user with passwordHash for verification
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }
  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash || '');
  if (!ok) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  const passwordHash = await bcrypt.hash(String(newPassword), config.bcryptRounds);
  await prisma.user.update({
    where: { id: authUser.id },
    data: { passwordHash },
  });
  return { message: 'Password changed successfully' };
}

module.exports = { getProfile, updateProfile, changePassword };