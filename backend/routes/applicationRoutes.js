const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadSingle, uploadMemoryOnly } = require('../middleware/uploadMiddleware');
const { createApplicationValidation } = require('../middleware/validationMiddleware');
const {
  createApplication,
  getUserApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  uploadDocument,
  validateApplication,
  extractDocument,
  getEstimate,
} = require('../controllers/applicationController');

// ── User Application Routes (parameterized - must come LAST) ────────────────
router.post('/',                protect, createApplicationValidation, createApplication);
router.get('/',                 protect, getUserApplications);
router.get('/estimate',         getEstimate); // Can be public or protected, doing unprotected so user doesn't need to log in to see estimates ideally, but keeping it simple. Wait, I'll make it protected or just unprotected, I'll leave it without protect so it's public. Wait, let's just make it public.
router.post('/validate',        protect, validateApplication);
router.post('/extract-document',protect, uploadMemoryOnly, extractDocument);
router.get('/:id',              protect, getApplicationById);
router.put('/:id',              protect, updateApplication);
router.delete('/:id',           protect, deleteApplication);
router.post('/:id/documents',   protect, uploadSingle, uploadDocument);

module.exports = router;
