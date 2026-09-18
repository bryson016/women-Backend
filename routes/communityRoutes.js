/**
 * Community routes (public content, same as before).
 * Mounted at `/api/community`.
 */
const express = require('express');
const communityController = require('../controllers/communityController');

const router = express.Router();

router.get('/impact-stories', communityController.impactStories);
router.get('/impact-stories/:slug', communityController.impactStoryBySlug);
router.get('/public-events', communityController.publicEvents);
router.post('/events/:id/register', communityController.registerForEvent);
router.get('/event-registrations', communityController.myEventRegistrations);
router.delete('/events/:id/register', communityController.cancelEventRegistration);
router.get('/public-programs', communityController.publicPrograms);

module.exports = router;