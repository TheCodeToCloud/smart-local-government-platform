const Application = require('../models/Application');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateCertificate } = require('../services/certificateService');

// We use require later inside functions for 'io' to avoid circular dependencies
// const { io } = require('../server');

// ─── 1. GET /admin/applications ───────────────────────────────────────────────
const getAllApplications = async (req, res, next) => {
  try {
    const {
      status,
      certificateType,
      priority,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (certificateType && certificateType !== 'all') filter.certificateType = certificateType;
    if (priority && priority !== 'all') filter.priority = priority;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build aggregation for urgent-first sort
    let query = Application.find(filter)
      .populate('userId', 'fullName email phone')
      .populate('reviewedBy', 'fullName email');

    // If searching by applicationNumber or applicantDetails.fullName
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { applicationNumber: searchRegex },
        { 'applicantDetails.fullName': searchRegex },
      ];
      query = Application.find(filter)
        .populate('userId', 'fullName email phone')
        .populate('reviewedBy', 'fullName email');
    }

    // Urgent first, then newest
    const [applications, total, statusCounts] = await Promise.all([
      query
        .sort({ priority: -1, createdAt: -1 }) // urgent=urgent sorts after normal with -1 on string
        .skip(skip)
        .limit(limitNum),
      Application.countDocuments(filter),
      Application.aggregate([
        { $match: search ? {} : filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Build stats from status counts
    const stats = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      draft: 0,
    };
    statusCounts.forEach(({ _id, count }) => {
      if (_id && stats.hasOwnProperty(_id)) stats[_id] = count;
    });

    // Re-sort: urgent first within result set
    const sorted = [...applications].sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json({
      success: true,
      data: {
        applications: sorted,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 2. PUT /admin/applications/:id/approve ───────────────────────────────────
const approveApplication = async (req, res, next) => {
  try {
    const { adminRemarks } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!['pending', 'under_review'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve application with status "${application.status}".`,
      });
    }

    // Check no existing certificate
    const existingCert = await Certificate.findOne({ applicationId: application._id });
    if (existingCert) {
      return res.status(400).json({ success: false, message: 'Certificate already issued for this application.' });
    }

    application.status = 'approved';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    if (adminRemarks) application.adminRemarks = adminRemarks;
    await application.save();

    // Generate certificate (PDF + QR + Cloudinary + save)
    const { certificate, pdfUrl } = await generateCertificate(application);

    // Smart Feature: Notifications & WebSockets
    const io = require('../socket').getIO();
    
    await Notification.create({
      userId: application.userId,
      title: 'Application Approved',
      message: `Your application for ${application.certificateType} certificate has been approved. You can now download it.`,
      type: 'success',
      relatedApplicationId: application._id,
    });

    io.to(`user_${application.userId.toString()}`).emit('application_status_update', {
      applicationId: application._id,
      applicationNumber: application.applicationNumber,
      status: 'approved',
      message: `Your application ${application.applicationNumber} has been approved! Certificate ready to download.`
    });

    res.status(200).json({
      success: true,
      message: 'Application approved and certificate issued.',
      data: { application, certificate, pdfUrl },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 3. PUT /admin/applications/:id/reject ────────────────────────────────────
const rejectApplication = async (req, res, next) => {
  try {
    const { rejectionReason, adminRemarks } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!['pending', 'under_review'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject application with status "${application.status}".`,
      });
    }

    application.status = 'rejected';
    application.rejectionReason = rejectionReason;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    if (adminRemarks) application.adminRemarks = adminRemarks;
    await application.save();

    // Smart Feature: Notifications & WebSockets
    const io = require('../socket').getIO();
    
    await Notification.create({
      userId: application.userId,
      title: 'Application Rejected',
      message: `Your application for ${application.certificateType} certificate was rejected. Reason: ${rejectionReason}`,
      type: 'error',
      relatedApplicationId: application._id,
    });

    io.to(`user_${application.userId.toString()}`).emit('application_status_update', {
      applicationId: application._id,
      applicationNumber: application.applicationNumber,
      status: 'rejected',
      message: `Your application ${application.applicationNumber} was rejected. Reason: ${rejectionReason}`
    });

    res.status(200).json({
      success: true,
      message: 'Application rejected.',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 4. PUT /admin/applications/:id/review ────────────────────────────────────
const setUnderReview = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending applications can be set to under review.',
      });
    }

    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + 7);

    application.status = 'under_review';
    application.estimatedCompletionDate = estimatedCompletionDate;
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application marked as under review.',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 5. GET /admin/stats ──────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalApps,
      pending,
      under_review,
      approved,
      rejected,
      draft,
      thisWeek,
      thisMonth,
      totalUsers,
      totalCerts,
      certsThisMonth,
      certTypeDistribution,
      recentApprovals,
      recentRejections,
      approvedToday,
      flaggedCount,
      municipalityAgg,
    ] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'under_review' }),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' }),
      Application.countDocuments({ status: 'draft' }),
      Application.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Application.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ role: 'user' }),
      Certificate.countDocuments({ isValid: true }),
      Certificate.countDocuments({ issuedDate: { $gte: startOfMonth } }),
      Application.aggregate([
        { $group: { _id: '$certificateType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Application.find({ status: 'approved', reviewedAt: { $exists: true } })
        .sort({ reviewedAt: -1 })
        .limit(5)
        .populate('userId', 'fullName')
        .populate('reviewedBy', 'fullName')
        .select('applicationNumber certificateType reviewedAt reviewedBy userId'),
      Application.find({ status: 'rejected', reviewedAt: { $exists: true } })
        .sort({ reviewedAt: -1 })
        .limit(5)
        .populate('userId', 'fullName')
        .populate('reviewedBy', 'fullName')
        .select('applicationNumber certificateType reviewedAt reviewedBy userId rejectionReason'),
      Application.countDocuments({ status: 'approved', reviewedAt: { $gte: startOfToday } }),
      Application.countDocuments({ status: { $in: ['pending', 'under_review'] }, flaggedForReview: true }),
      Application.aggregate([
        { $match: { 'applicantDetails.municipalityName': { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$applicantDetails.municipalityName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
    ]);

    // Build recent activity (merge approvals + rejections, sort by time)
    const recentActivity = [
      ...recentApprovals.map((a) => ({
        action: 'approved',
        applicationNumber: a.applicationNumber,
        certificateType: a.certificateType,
        adminName: a.reviewedBy?.fullName || 'Admin',
        applicantName: a.userId?.fullName || 'Unknown',
        time: a.reviewedAt,
      })),
      ...recentRejections.map((a) => ({
        action: 'rejected',
        applicationNumber: a.applicationNumber,
        certificateType: a.certificateType,
        adminName: a.reviewedBy?.fullName || 'Admin',
        applicantName: a.userId?.fullName || 'Unknown',
        time: a.reviewedAt,
        reason: a.rejectionReason,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    // Most requested certificate type
    const mostRequested = certTypeDistribution[0]?._id || 'N/A';

    // Average processing time (approved apps that have both createdAt and reviewedAt)
    const processingTimePipeline = await Application.aggregate([
      { $match: { status: 'approved', reviewedAt: { $exists: true } } },
      {
        $project: {
          processingDays: {
            $divide: [{ $subtract: ['$reviewedAt', '$createdAt'] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      { $group: { _id: null, avgDays: { $avg: '$processingDays' } } },
    ]);
    const avgProcessingDays = Math.round(processingTimePipeline[0]?.avgDays || 0);

    // ── Insights ──
    const busiestMunicipality = municipalityAgg[0]?._id || 'N/A';
    
    const totalProcessed = approved + rejected;
    const approvalRate = totalProcessed > 0 ? ((approved / totalProcessed) * 100).toFixed(1) : 0;
    const rejectionRate = totalProcessed > 0 ? ((rejected / totalProcessed) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: totalApps,
          pending,
          under_review,
          approved,
          rejected,
          draft,
          thisWeek,
          thisMonth,
          approvedToday,
          flaggedCount,
        },
        totalUsers,
        totalCerts,
        certsThisMonth,
        certTypeDistribution,
        mostRequested,
        recentActivity,
        avgProcessingDays,
        insights: {
          busiestMunicipality,
          approvalRate,
          rejectionRate,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 6. GET /admin/users ──────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;

    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (isActive !== undefined && isActive !== 'all') filter.isActive = isActive === 'true';

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ fullName: searchRegex }, { email: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-password'),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── 7. PUT /admin/users/:id/toggle-status ────────────────────────────────────
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate admin accounts.',
      });
    }

    // Prevent self-deactivation
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllApplications,
  approveApplication,
  rejectApplication,
  setUnderReview,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
};
