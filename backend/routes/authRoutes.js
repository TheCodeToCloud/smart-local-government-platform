const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  uploadProfilePhoto,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require('../middleware/validationMiddleware');

// @route   POST /api/auth/register
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
router.post('/login', loginValidation, login);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @route   PUT /api/auth/update-profile
router.put('/update-profile', protect, updateProfileValidation, updateProfile);

// @route   PUT /api/auth/change-password
router.put('/change-password', protect, changePasswordValidation, changePassword);

// @route   POST /api/auth/upload-photo
router.post('/upload-photo', protect, uploadSingle, uploadProfilePhoto);

module.exports = router;
