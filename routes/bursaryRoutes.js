/**
 * Bursary routes. Mounted at `/api/bursary`.
 * Every route requires a valid JWT; citizen and admin roles may use them.
 * Endpoint paths are unchanged so the mobile app keeps working.
 */
const express = require('express');
const multer = require('multer');
const bursaryController = require('../controllers/bursaryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

router.use(authenticateToken, requireRole('citizen', 'admin'));

router.post('/documents', upload.single('file'), bursaryController.uploadDocument);
router.get('/documents/:id/content', bursaryController.documentContent);
router.post('/apply', upload.none(), bursaryController.apply);
router.get('/my-applications', bursaryController.myApplications);
router.get('/my-applications/:id', bursaryController.myApplication);
router.put('/my-applications/:id/withdraw', bursaryController.withdraw);
router.delete('/my-applications/:id', bursaryController.remove);
router.get('/my-applications/:id/history', bursaryController.history);

module.exports = router;