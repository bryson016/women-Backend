/**
 * Bursary service.
 * Applications are owned by the authenticated user (`userId`); every
 * read/update/delete is ownership-checked so users can only ever see or
 * mutate their own applications.
 */
const { store, nextId } = require('../database/store');
const { ApiError } = require('../utils/asyncHandler');

function toPublic(application) {
  const { userId, ...rest } = application;
  return rest;
}

function apply(data, userId) {
  const formData = data && typeof data === 'object' ? data : {};
  const newApplication = {
    id: nextId(store.bursaryApplications),
    ...formData,
    userId,
    status: 'Pending',
    submittedAt: new Date().toISOString(),
    applicationCode: `BUR-${Date.now().toString(36).toUpperCase()}`,
  };
  store.bursaryApplications.push(newApplication);
  return {
    message: 'Bursary application submitted successfully',
    application: {
      id: newApplication.id,
      applicationCode: newApplication.applicationCode,
      status: newApplication.status,
    },
  };
}

function myApplications(userId) {
  return {
    applications: store.bursaryApplications
      .filter((a) => a.userId === userId)
      .map(toPublic),
  };
}

function findOwned(id, userId) {
  const application = store.bursaryApplications.find(
    (a) => a.id === parseInt(id, 10) && a.userId === userId
  );
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  return application;
}

function myApplication(id, userId) {
  return { application: toPublic(findOwned(id, userId)) };
}

function withdraw(id, userId) {
  const application = findOwned(id, userId);
  application.status = 'Withdrawn';
  return { message: 'Application withdrawn successfully', application: toPublic(application) };
}

function remove(id, userId) {
  const index = store.bursaryApplications.findIndex(
    (a) => a.id === parseInt(id, 10) && a.userId === userId
  );
  if (index === -1) {
    throw new ApiError(404, 'Application not found');
  }
  store.bursaryApplications.splice(index, 1);
  return { message: 'Application deleted successfully' };
}

function history(id, userId) {
  findOwned(id, userId);
  return { history: [] };
}

module.exports = { apply, myApplications, myApplication, withdraw, remove, history };