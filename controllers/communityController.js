/** Community controller — thin HTTP layer over `communityService`. */
const { asyncHandler } = require('../utils/asyncHandler');
const communityService = require('../services/communityService');

const impactStories = asyncHandler(async (req, res) => {
  console.log('[COMMUNITY] Get impact stories');
  res.json(communityService.impactStories());
});

const impactStoryBySlug = asyncHandler(async (req, res) => {
  console.log('[COMMUNITY] Get impact story by slug:', req.params.slug);
  res.json(communityService.impactStoryBySlug());
});

const publicEvents = asyncHandler(async (req, res) => {
  console.log('[COMMUNITY] Get public events');
  res.json(await communityService.publicEvents());
});

const registerForEvent = asyncHandler(async (req, res) => {
  console.log('[COMMUNITY] Register for event:', req.params.id);
  res.json(communityService.registerForEvent());
});

const myEventRegistrations = asyncHandler(async (req, res) => {
  console.log('[COMMUNITY] Get my event registrations');
  res.json(communityService.myEventRegistrations());
});

const cancelEventRegistration = asyncHandler(async (req, res) => {
  console.log('[COMMUNITY] Cancel event registration:', req.params.id);
  res.json(communityService.cancelEventRegistration());
});

const publicPrograms = asyncHandler(async (req, res) => {
  console.log('[COMMUNITY] Get public programs');
  res.json(communityService.publicPrograms());
});

module.exports = {
  impactStories,
  impactStoryBySlug,
  publicEvents,
  registerForEvent,
  myEventRegistrations,
  cancelEventRegistration,
  publicPrograms,
};