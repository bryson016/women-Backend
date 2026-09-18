/** Public auth routes + authenticated `me`. Mounted at `/api/auth`. */
const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.me);
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

module.exports = router;