/**
 * Community service — public content endpoints (no authentication required,
 * same as before).
 */
const { store } = require('../database/store');

function impactStories() {
  return { stories: [] };
}

function impactStoryBySlug() {
  const err = new Error('Impact story not found');
  err.status = 404;
  throw err;
}

function publicEvents() {
  return { events: store.events.slice() };
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