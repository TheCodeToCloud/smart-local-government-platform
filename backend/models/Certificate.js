const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      // unique enforced via schema.index below
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      // unique enforced via schema.index below
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    certificateType: {
      type: String,
      required: true,
      enum: ['birth', 'citizenship', 'residence', 'marriage', 'death', 'income', 'character'],
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      // Set to 5 years from issuedDate in pre-save hook
    },
    pdfUrl: {
      type: String, // Cloudinary URL for the generated PDF
      default: null,
    },
    qrCodeUrl: {
      type: String, // Cloudinary URL for QR code image
      default: null,
    },
    qrCodeData: {
      type: String, // Verification URL embedded in QR code
      default: null,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      trim: true,
      default: null,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    duplicateRequestStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    duplicateRequestReason: {
      type: String,
      trim: true,
      default: null,
    },
    duplicateRequestDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
certificateSchema.index({ certificateNumber: 1 }, { unique: true, sparse: true });
certificateSchema.index({ userId: 1, isValid: 1 });
certificateSchema.index({ applicationId: 1 }, { unique: true, sparse: true });

// ─── Pre-save: Auto-generate Certificate Number & Set Expiry ─────────────────
certificateSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const year = new Date().getFullYear();
      const typeCode = this.certificateType.toUpperCase().slice(0, 4);
      const count = await this.constructor.countDocuments();
      const sequence = String(count + 1).padStart(6, '0');
      this.certificateNumber = `CERT-${typeCode}-${year}-${sequence}`;

      // Set expiry to 5 years from issued date
      const expiry = new Date(this.issuedDate || Date.now());
      expiry.setFullYear(expiry.getFullYear() + 5);
      this.expiryDate = expiry;

      // Set QR code data (verification URL)
      this.qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${this.certificateNumber}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// ─── Virtual: isExpired ───────────────────────────────────────────────────────
certificateSchema.virtual('isExpired').get(function () {
  return this.expiryDate && new Date() > this.expiryDate;
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
