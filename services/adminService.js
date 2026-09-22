/**
 * Admin service (Prisma/PostgreSQL) — all functions assume the caller already
 * passed `requireRole('admin')`. Every route in `adminRoutes` is protected, so
 * a citizen token can never reach these functions.
 * Response shapes are preserved exactly as before.
 */
const { prisma } = require('../prisma/client');
const { sanitizeUser } = require('../middleware/auth');
const { ApiError } = require('../utils/asyncHandler');

const APPLICATION_STATUSES = ['Pending', 'Approved', 'Rejected', 'Withdrawn'];

function toPublicApplication(application) {
  if (!application) return application;
  const { userId, data, ...rest } = application;
  const formFields = data && typeof data === 'object' ? data : {};
  return { ...formFields, ...rest };
}

async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return { users: users.map(sanitizeUser) };
}

async function listApplications() {
  const rows = await prisma.bursaryApplication.findMany({ orderBy: { createdAt: 'desc' } });
  return { applications: rows.map(toPublicApplication) };
}

async function updateApplicationStatus(id, status) {
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${APPLICATION_STATUSES.join(', ')}`);
  }
  const existing = await prisma.bursaryApplication.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!existing) {
    throw new ApiError(404, 'Application not found');
  }
  const updated = await prisma.bursaryApplication.update({
    where: { id: parseInt(id, 10) },
    data: { status },
  });
  return { message: 'Application updated successfully', application: toPublicApplication(updated) };
}

async function listComplaints() {
  const rows = await prisma.complaint.findMany({ orderBy: { createdAt: 'desc' } });
  return { complaints: rows };
}

module.exports = { listUsers, listApplications, updateApplicationStatus, listComplaints };