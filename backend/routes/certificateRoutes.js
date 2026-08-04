const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserCertificates,
  downloadCertificate,
  verifyCertificate,
  recordPrint,
} = require('../controllers/certificateController');

// Public route for verification
router.get('/verify/:certNumber', verifyCertificate);

// Protected routes
router.use(protect);
router.get('/', getUserCertificates);
router.get('/:id/download', downloadCertificate);
router.post('/:id/record-print', recordPrint);

module.exports = router;
