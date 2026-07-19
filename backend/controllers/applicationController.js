const Application = require('../models/Application');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validateApplicationData, detectAnomalies } = require('../services/smartValidationService');
const { extractDocumentData } = require('../services/ocrService');
const { getEstimatedProcessingTime } = require('../services/predictionService');

// ─── Helper: build applicationNumber ─────────────────────────────────────────
const generateAppNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Application.countDocuments();
  const seq = String(count + 1).padStart(6, '0');
  return `APP-${year}-${seq}`;
};

// ─── 1. POST /api/applications ────────────────────────────────────────────────
const createApplication = async (req, res, next) => {
  try {
    const { certificateType, priority, applicantDetails, spouseDetails, smartFormData } = req.body;

    if (!certificateType) {
      return res.status(400).json({ success: false, message: 'Certificate type is required.' });
    }

    const applicationNumber = await generateAppNumber();

    // Set estimated completion (7 business days)
    const estimated = new Date();
    estimated.setDate(estimated.getDate() + 7);

    // ── Smart Feature: Anomaly Detection ──
    const { flaggedForReview, flagReasons } = await detectAnomalies(req.user._id, applicantDetails || {}, certificateType);

    const application = await Application.create({
      applicationNumber,
      userId: req.user._id,
      certificateType,
      priority: priority || 'normal',
      status: 'pending',
      applicantDetails: applicantDetails || {},
      spouseDetails: spouseDetails || undefined,
      smartFormData: smartFormData || null,
      estimatedCompletionDate: estimated,
      flaggedForReview,
      flagReasons,
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 2. GET /api/applications ─────────────────────────────────────────────────
const getUserApplications = async (req, res, next) => {
  try {
    const { status, certificateType, page = 1, limit = 10 } = req.query;

    const filter = { userId: req.user._id };
    if (status && status !== 'all') filter.status = status;
    if (certificateType && certificateType !== 'all') filter.certificateType = certificateType;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('reviewedBy', 'fullName'),
      Application.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        applications,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 3. GET /api/applications/:id ────────────────────────────────────────────
const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('reviewedBy', 'fullName email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Ownership check (admin bypasses)
    if (
      req.user.role !== 'admin' &&
      application.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: { application } });
  } catch (error) {
    next(error);
  }
};

// ─── 4. PUT /api/applications/:id ────────────────────────────────────────────
const updateApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const editableStatuses = ['draft', 'rejected'];
    if (!editableStatuses.includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Applications with status "${application.status}" cannot be edited.`,
      });
    }

    const { applicantDetails, priority, certificateType } = req.body;

    if (applicantDetails) {
      application.applicantDetails = { ...application.applicantDetails.toObject?.() ?? {}, ...applicantDetails };
    }
    if (priority) application.priority = priority;
    if (certificateType) application.certificateType = certificateType;

    // Resubmission from rejected state
    if (application.status === 'rejected') {
      application.status = 'pending';
      application.rejectionReason = undefined;
      application.reviewedBy = undefined;
      application.reviewedAt = undefined;

      const estimated = new Date();
      estimated.setDate(estimated.getDate() + 7);
      application.estimatedCompletionDate = estimated;
    }

    await application.save();

    res.status(200).json({
      success: true,
      message: application.status === 'pending' ? 'Application resubmitted successfully.' : 'Application updated.',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 5. DELETE /api/applications/:id ─────────────────────────────────────────
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (application.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft applications can be deleted.',
      });
    }

    await application.deleteOne();

    res.status(200).json({ success: true, message: 'Application deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── 6. POST /api/applications/:id/documents ─────────────────────────────────
const uploadDocument = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { documentType } = req.body;
    if (!documentType) {
      return res.status(400).json({ success: false, message: 'documentType is required.' });
    }

    application.uploadedDocuments.push({
      documentType,
      cloudinaryUrl: req.file.cloudinaryUrl,
      publicId: req.file.publicId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedAt: new Date(),
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 7. POST /api/applications/validate ───────────────────────────────────────
const validateApplication = async (req, res, next) => {
  try {
    const { certificateType, applicantDetails, uploadedDocuments } = req.body;
    
    if (!certificateType || !applicantDetails) {
      return res.status(400).json({ success: false, message: 'Missing required data for validation.' });
    }

    const validationResult = validateApplicationData(certificateType, applicantDetails, uploadedDocuments || []);
    
    res.status(200).json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    next(error);
  }
};

// ─── 8. POST /api/applications/extract-document ──────────────────────────────
const extractDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const ocrResult = await extractDocumentData(req.file.buffer);
    res.status(200).json({
      success: true,
      data: ocrResult
    });
  } catch (error) {
    next(error);
  }
};

// ─── 9. GET /api/applications/estimate ───────────────────────────────────────
const getEstimate = async (req, res, next) => {
  try {
    const { certificateType, priority = 'normal' } = req.query;
    if (!certificateType) {
      return res.status(400).json({ success: false, message: 'certificateType is required.' });
    }
    const estimate = await getEstimatedProcessingTime(certificateType, priority);
    res.status(200).json({ success: true, data: estimate });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getUserApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  uploadDocument,
  validateApplication,
  extractDocument,
  getEstimate,
};
