const express = require('express');
const router = express.Router();
const { protect, officerOnly } = require('../middleware/authMiddleware');
const {
  getPendingApplications,
  verifyApplication,
  returnApplicationForCorrection,
} = require('../controllers/officerController');

router.use(protect);
router.use(officerOnly);

// @route   GET /api/officer/applications
// @desc    Get all pending applications for officer review
router.get('/applications', getPendingApplications);

// @route   PUT /api/officer/applications/:id/verify
// @desc    Verify documents and forward to Admin
router.put('/applications/:id/verify', verifyApplication);

// @route   PUT /api/officer/applications/:id/return
// @desc    Return application to user for correction
router.put('/applications/:id/return', returnApplicationForCorrection);

module.exports = router;
