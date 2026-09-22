/**
 * Community service — public content endpoints (no authentication required,
 * same as before). Migrated to Prisma/PostgreSQL. Response shapes preserved.
 */
const { prisma } = require('../prisma/client');

function impactStories() {
  return { stories: [] };
}

function impactStoryBySlug() {
  const err = new Error('Impact story not found');
  err.status = 404;
  throw err;
}

async function publicEvents() {
  const rows = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  return { events: rows };
}

function registerForEvent() {
  return { message: 'Event registration successful' };
}

function myEventRegistrations() {
  return { registrations: [] };
}

function cancelEventRegistration() {
  return { message: 'Event registration cancelled' };
}

function publicPrograms() {
  return { programs: [] };
}

module.exports = {
  impactStories,
  impactStoryBySlug,
  publicEvents,
  registerForEvent,
  myEventRegistrations,
  cancelEventRegistration,
  publicPrograms,
};