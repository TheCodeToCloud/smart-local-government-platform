const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAllApplications,
  approveApplication,
  rejectApplication,
  setUnderReview,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
} = require('../controllers/adminController');
const {
  rejectApplicationValidation,
  approveApplicationValidation,
} = require('../middleware/validationMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/stats', getDashboardStats);

router.get('/applications', getAllApplications);
router.put('/applications/:id/approve', approveApplicationValidation, approveApplication);
router.put('/applications/:id/reject', rejectApplicationValidation, rejectApplication);
router.put('/applications/:id/review', setUnderReview);

router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;
