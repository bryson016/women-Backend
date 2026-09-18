/**
 * Citizen routes. Mounted at `/api/citizen`.
 * Every route requires a valid JWT; citizen and admin roles may use them.
 * Endpoint paths are unchanged so the mobile app keeps working.
 */
const express = require('express');
const citizenController = require('../controllers/citizenController');
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRole('citizen', 'admin'));

router.get('/dashboard', citizenController.dashboard);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

router.get('/complaints', citizenController.complaints);
router.post('/complaints', citizenController.submitComplaint);
router.get('/complaints/:id', citizenController.complaintDetails);
router.get('/complaints/:id/attachments', citizenController.complaintAttachments);
router.post('/complaints/:id/attachments', citizenController.uploadComplaintAttachment);

router.get('/projects', citizenController.projects);
router.get('/meetings', citizenController.meetings);
router.get('/announcements', citizenController.announcements);

router.get('/notifications', citizenController.notifications);
router.put('/notifications/read-all', citizenController.markAllNotificationsRead);
router.put('/notifications/:id/read', citizenController.markNotificationRead);

router.get('/events', citizenController.events);
router.get('/applications', citizenController.applications);
router.get('/programs', citizenController.programs);
router.get('/public-participation', citizenController.publicParticipation);

router.post('/feedback', citizenController.submitFeedback);

router.get('/chat/messages', citizenController.chatMessages);
router.post('/chat/messages', citizenController.sendChatMessage);

router.post('/change-password', userController.changePassword);

router.get('/notification-settings', citizenController.notificationSettings);
router.put('/notification-settings', citizenController.updateNotificationSettings);

router.post('/device-token', citizenController.updateDeviceToken);

module.exports = router;