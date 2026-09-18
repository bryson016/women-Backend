/**
 * Admin service — all functions assume the caller already passed
 * `requireRole('admin')`. Every route in `adminRoutes` is protected, so a
 * citizen token can never reach these functions.
 */
const { store } = require('../database/store');
const { sanitizeUser } = require('../middleware/auth');
const { ApiError } = require('../utils/asyncHandler');

const APPLICATION_STATUSES = ['Pending', 'Approved', 'Rejected', 'Withdrawn'];

function listUsers() {
  return { users: store.users.map(sanitizeUser) };
}

function listApplications() {
  return {
    applications: store.bursaryApplications.map((a) => {
      const { userId, ...rest } = a;
      return rest;
    }),
  };
}

function updateApplicationStatus(id, status) {
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${APPLICATION_STATUSES.join(', ')}`);
  }
  const application = store.bursaryApplications.find((a) => a.id === parseInt(id, 10));
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  application.status = status;
  const { userId, ...rest } = application;
  return { message: 'Application updated successfully', application: rest };
}

function listComplaints() {
  return { complaints: store.complaints.slice() };
}

module.exports = { listUsers, listApplications, updateApplicationStatus, listComplaints };