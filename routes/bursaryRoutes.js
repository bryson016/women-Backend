/**
 * Bursary routes. Mounted at `/api/bursary`.
 * Every route requires a valid JWT; citizen and admin roles may use them.
 * Endpoint paths are unchanged so the mobile app keeps working.
 */
const express = require('express');
const bursaryController = require('../controllers/bursaryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRole('citizen', 'admin'));

router.post('/apply', bursaryController.apply);
router.get('/my-applications', bursaryController.myApplications);
router.get('/my-applications/:id', bursaryController.myApplication);
router.put('/my-applications/:id/withdraw', bursaryController.withdraw);
router.delete('/my-applications/:id', bursaryController.remove);
router.get('/my-applications/:id/history', bursaryController.history);

module.exports = router;