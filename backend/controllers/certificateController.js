const Certificate = require('../models/Certificate');

// ─── 1. GET /api/certificates/my ─────────────────────────────────────────────
const getUserCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id })
      .sort({ issuedDate: -1 })
      .populate('applicationId', 'certificateType applicantDetails.fullName');
      
    res.status(200).json({ success: true, data: { certificates } });
  } catch (error) {
    next(error);
  }
};

// ─── 2. GET /api/certificates/:id/download ────────────────────────────────────
const downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id).populate('applicationId');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    if (certificate.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Generate PDF on the fly
    const QRCode = require('qrcode');
    const { generatePDF } = require('../services/certificateService');
    
    // Generate QR code buffer for the PDF
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrCodeData = `${frontendUrl}/verify/${certificate.certificateNumber}`;
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 200,
      margin: 1,
      color: { dark: '#1e3a5f', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });

    const pdfBuffer = await generatePDF(certificate.applicationId, certificate, qrCodeBuffer);

    certificate.downloadCount += 1;
    await certificate.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${certificate.certificateNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// ─── 3. GET /api/certificates/verify/:certNumber (PUBLIC) ─────────────────────
const verifyCertificate = async (req, res, next) => {
  try {
    const { certNumber } = req.params;
    
    const certificate = await Certificate.findOne({ certificateNumber: certNumber })
      .populate('userId', 'fullName email')
      .populate('applicationId', 'certificateType applicantDetails');

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        data: { isValid: false, message: 'Certificate not found' }
      });
    }

    if (!certificate.isValid) {
      return res.status(200).json({
        success: true,
        data: { 
          isValid: false, 
          message: 'Certificate revoked', 
          revokedReason: certificate.revokedReason 
        }
      });
    }

    const isExpired = new Date() > certificate.expiryDate;
    if (isExpired) {
      return res.status(200).json({
        success: true,
        data: {
          isValid: false,
          message: 'Certificate has expired'
        }
      });
    }

    const application = certificate.applicationId || {};
    const applicantDetails = application.applicantDetails || {};

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        certificateNumber: certificate.certificateNumber,
        holderName: applicantDetails.fullName || (certificate.userId ? certificate.userId.fullName : 'Unknown'),
        certificateType: certificate.certificateType,
        issuedDate: certificate.issuedDate,
        expiryDate: certificate.expiryDate,
        issuedBy: 'Local Government Office',
        verifiedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── 4. POST /api/certificates/:id/record-print ───────────────────────────────
const recordPrint = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    // Admins, officers, or the owner can print
    if (certificate.userId.toString() !== req.user._id.toString() && req.user.role === 'citizen') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    certificate.downloadCount = (certificate.downloadCount || 0) + 1;
    await certificate.save();

    res.status(200).json({ 
      success: true, 
      data: { downloadCount: certificate.downloadCount }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserCertificates,
  downloadCertificate,
  verifyCertificate,
  recordPrint,
};
