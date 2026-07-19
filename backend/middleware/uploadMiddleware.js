const multer = require('multer');
const path = require('path');
const FileType = require('file-type');
const { uploadToCloudinary } = require('../config/cloudinary');

// ─── Memory Storage Engine ──────────────────────────────────────────────────
const storage = multer.memoryStorage();

// ─── File Filter (Basic check) ─────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype.toLowerCase().replace('application/', ''));

  if (extOk && (mimeOk || file.mimetype === 'application/pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

// ─── Multer Instance ───────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// ─── Cloudinary Upload & Validation Middleware ────────────────────────────
const processAndUploadToCloudinary = async (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  const files = req.file ? [req.file] : req.files;
  const userId = req.user?._id || 'anonymous';
  const applicationId = req.params.id || 'general';

  try {
    for (const file of files) {
      // 1. Magic Bytes Validation
      const fileType = await FileType.fromBuffer(file.buffer);
      if (!fileType || !['pdf', 'png', 'jpg', 'jpeg'].includes(fileType.ext)) {
        throw new Error(`Invalid file type detected. Disguised files are not allowed. Detected: ${fileType?.ext || 'unknown'}`);
      }

      // 2. Upload to Cloudinary
      const folderPath = `smart-gov/${userId}/${applicationId}`;
      const baseName = path.basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9]/g, '-')
        .substring(0, 40);
      const publicId = `${Date.now()}-${baseName}`;

      const result = await uploadToCloudinary(file.buffer, {
        folder: folderPath,
        public_id: publicId,
        resource_type: 'auto',
      });

      // 3. Attach Cloudinary info to file object
      file.cloudinaryUrl = result.secure_url;
      file.publicId = result.public_id;
    }
    next();
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─── Error Handler Wrapper ─────────────────────────────────────────────────
const handleUpload = (uploadMiddleware, uploadToCloud = true) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File is too large. Maximum allowed size is 5MB.',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    
    if (uploadToCloud) {
      // Proceed to Cloudinary upload middleware
      processAndUploadToCloudinary(req, res, next);
    } else {
      // Skip Cloudinary (e.g. for OCR)
      next();
    }
  });
};

module.exports = {
  uploadSingle: handleUpload(upload.single('document'), true),
  uploadMultiple: handleUpload(upload.array('documents', 5), true),
  uploadMemoryOnly: handleUpload(upload.single('document'), false),
};
