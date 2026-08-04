const Application = require('../models/Application');
const { emitNotification } = require('../socket');
const Notification = require('../models/Notification');

// @desc    Get all applications that need verification (status: pending, returned_for_correction - wait, only pending or under_review)
// @route   GET /api/officer/applications
// @access  Private/Officer
exports.getPendingApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({
      status: { $in: ['pending', 'under_review'] }
    })
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify application and forward to admin
// @route   PUT /api/officer/applications/:id/verify
// @access  Private/Officer
exports.verifyApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return res.status(400).json({ success: false, message: `Cannot verify application with status: ${application.status}` });
    }

    application.status = 'verified';
    application.verifiedBy = req.user._id;
    application.verifiedAt = Date.now();

    await application.save();

    // Notify user
    const notification = await Notification.create({
      userId: application.userId,
      title: 'Application Verified',
      message: `Your application (${application.applicationNumber}) documents have been verified and forwarded for final approval.`,
      type: 'status_update',
      link: `/applications/${application._id}`,
    });
    emitNotification(application.userId.toString(), notification);

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return application for correction
// @route   PUT /api/officer/applications/:id/return
// @access  Private/Officer
exports.returnApplicationForCorrection = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for correction is required' });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = 'returned_for_correction';
    application.rejectionReason = reason; // reusing this field for correction remarks
    
    await application.save();

    // Notify user
    const notification = await Notification.create({
      userId: application.userId,
      title: 'Action Required on Application',
      message: `Your application (${application.applicationNumber}) requires correction. Reason: ${reason}`,
      type: 'action_required',
      link: `/applications/${application._id}`,
    });
    emitNotification(application.userId.toString(), notification);

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats for officer
// @route   GET /api/officer/stats
// @access  Private/Officer
exports.getOfficerStats = async (req, res, next) => {
  try {
    const pendingCount = await Application.countDocuments({
      status: { $in: ['pending', 'under_review'] }
    });

    const verifiedCount = await Application.countDocuments({
      status: 'verified',
      verifiedBy: req.user._id
    });

    const returnedCount = await Application.countDocuments({
      status: 'returned_for_correction'
      // Ideally we would track returnedBy but since we don't have it explicitly, we can just show total returned, or assume the officer is checking the system's global returns.
      // We will just show total returned applications for now.
    });

    res.status(200).json({
      success: true,
      data: {
        pending: pendingCount,
        verified: verifiedCount,
        returned: returnedCount
      }
    });
  } catch (error) {
    next(error);
  }
};
