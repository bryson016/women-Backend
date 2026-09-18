/**
 * Admin routes. Mounted at `/api/admin`.
 * ADMIN ONLY — `requireRole('admin')` is enforced server-side, so a citizen
 * token (even a forged/modified client) always receives 403 here.
 */
const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/users', adminController.listUsers);
router.get('/applications', adminController.listApplications);
router.put('/applications/:id', adminController.updateApplicationStatus);
router.get('/complaints', adminController.listComplaints);

module.exports = router;