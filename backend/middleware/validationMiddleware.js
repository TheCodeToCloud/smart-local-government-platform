const { validationResult, body, param } = require('express-validator');

// ─── Generic validation runner ─────────────────────────────────────────────────
// Reads validation errors and returns a consistent {success: false, message} shape.
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array({ onlyFirstError: true })[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
    });
  }
  next();
};

// ─── Shared field definitions ──────────────────────────────────────────────────
const CERTIFICATE_TYPES = ['birth', 'citizenship', 'residence', 'marriage', 'death', 'income', 'character'];
const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

// ─── Auth Validators ───────────────────────────────────────────────────────────
const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Please provide a valid phone number (7-20 digits).'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters.'),

  validateRequest,
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.'),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  validateRequest,
];

const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.'),

  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Please provide a valid phone number.'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters.'),

  body('citizenshipNumber')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Citizenship number is too long.'),

  validateRequest,
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),

  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
    .matches(/[A-Za-z]/).withMessage('New password must contain at least one letter.')
    .matches(/[0-9]/).withMessage('New password must contain at least one number.'),

  validateRequest,
];

// ─── Application Validators ────────────────────────────────────────────────────
const createApplicationValidation = [
  body('certificateType')
    .notEmpty().withMessage('Certificate type is required.')
    .isIn(CERTIFICATE_TYPES).withMessage(`Invalid certificate type. Must be one of: ${CERTIFICATE_TYPES.join(', ')}.`),

  body('priority')
    .optional()
    .isIn(['normal', 'urgent']).withMessage("Priority must be 'normal' or 'urgent'."),

  body('applicantDetails.fullName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Applicant full name is too long.'),

  body('applicantDetails.dateOfBirth')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const dob = new Date(value);
      if (isNaN(dob.getTime())) {
        throw new Error('Date of birth must be a valid date.');
      }
      if (dob > new Date()) {
        throw new Error('Date of birth cannot be in the future.');
      }
      return true;
    }),

  body('applicantDetails.citizenshipNumber')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Citizenship number is too long.'),

  body('applicantDetails.province')
    .optional()
    .isIn(PROVINCES).withMessage(`Invalid province. Must be one of: ${PROVINCES.join(', ')}.`),

  body('applicantDetails.wardNumber')
    .optional()
    .trim()
    .isLength({ max: 10 }).withMessage('Ward number is too long.'),

  body('applicantDetails.permanentAddress')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Permanent address cannot exceed 500 characters.'),

  validateRequest,
];

// ─── Admin Action Validators ───────────────────────────────────────────────────
const rejectApplicationValidation = [
  body('rejectionReason')
    .trim()
    .notEmpty().withMessage('Rejection reason is required.')
    .isLength({ max: 1000 }).withMessage('Rejection reason cannot exceed 1000 characters.'),

  body('adminRemarks')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Admin remarks cannot exceed 2000 characters.'),

  validateRequest,
];

const approveApplicationValidation = [
  body('adminRemarks')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Admin remarks cannot exceed 2000 characters.'),

  validateRequest,
];

module.exports = {
  validateRequest,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  createApplicationValidation,
  rejectApplicationValidation,
  approveApplicationValidation,
};
