const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserCertificates,
  getDuplicateRequests,
  downloadCertificate,
  verifyCertificate,
  recordPrint,
  requestDuplicate,
  approveDuplicate,
  rejectDuplicate,
} = require('../controllers/certificateController');

// Public route for verification
router.get('/verify/:certNumber', verifyCertificate);

// Protected routes
router.use(protect);
router.get('/', getUserCertificates);
router.get('/duplicate-requests', getDuplicateRequests);
router.get('/:id/download', downloadCertificate);
router.post('/:id/record-print', recordPrint);
router.post('/:id/request-duplicate', requestDuplicate);
router.put('/:id/approve-duplicate', approveDuplicate);
router.put('/:id/reject-duplicate', rejectDuplicate);

module.exports = router;
