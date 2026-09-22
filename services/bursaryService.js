/**
 * Bursary service (Prisma/PostgreSQL).
 * Applications are owned by the authenticated user (`userId`); every
 * read/update/delete is ownership-checked so users can only ever see or
 * mutate their own applications.
 * Response shapes are preserved exactly as the mobile app consumes them.
 */
const { prisma } = require('../prisma/client');
const { ApiError } = require('../utils/asyncHandler');

function toPublic(application) {
  if (!application) return application;
  const { userId, data, ...rest } = application;
  const formFields = data && typeof data === 'object' ? data : {};
  return { ...formFields, ...rest };
}

async function apply(data, userId) {
  const formData = data && typeof data === 'object' ? data : {};
  const newApplication = await prisma.bursaryApplication.create({
    data: {
      userId,
      status: 'Pending',
      applicationCode: `BUR-${Date.now().toString(36).toUpperCase()}`,
      data: formData,
    },
  });
  return {
    message: 'Bursary application submitted successfully',
    application: {
      id: newApplication.id,
      applicationCode: newApplication.applicationCode,
      status: newApplication.status,
    },
  };
}

async function myApplications(userId) {
  const rows = await prisma.bursaryApplication.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return { applications: rows.map(toPublic) };
}

async function findOwned(id, userId) {
  const application = await prisma.bursaryApplication.findFirst({
    where: { id: parseInt(id, 10), userId },
  });
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  return application;
}

async function myApplication(id, userId) {
  const application = await findOwned(id, userId);
  return { application: toPublic(application) };
}

async function withdraw(id, userId) {
  await findOwned(id, userId);
  const updated = await prisma.bursaryApplication.update({
    where: { id: parseInt(id, 10) },
    data: { status: 'Withdrawn' },
  });
  return { message: 'Application withdrawn successfully', application: toPublic(updated) };
}

async function remove(id, userId) {
  const result = await prisma.bursaryApplication.deleteMany({
    where: { id: parseInt(id, 10), userId },
  });
  if (result.count === 0) {
    throw new ApiError(404, 'Application not found');
  }
  return { message: 'Application deleted successfully' };
}

async function history(id, userId) {
  await findOwned(id, userId);
  return { history: [] };
}

module.exports = { apply, myApplications, myApplication, withdraw, remove, history };