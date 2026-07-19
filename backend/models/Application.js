const mongoose = require('mongoose');
const { format } = require('date-fns');

const uploadedDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    cloudinaryUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number }, // bytes
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);


const applicantDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    citizenshipNumber: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    grandfatherName: { type: String, trim: true },
    permanentAddress: { type: String, trim: true },
    temporaryAddress: { type: String, trim: true },
    wardNumber: { type: String, trim: true },
    municipalityName: { type: String, trim: true },
    districtName: { type: String, trim: true },
    province: {
      type: String,
      enum: [
        'Koshi',
        'Madhesh',
        'Bagmati',
        'Gandaki',
        'Lumbini',
        'Karnali',
        'Sudurpashchim',
      ],
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      // unique enforced via schema.index below
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    certificateType: {
      type: String,
      required: [true, 'Certificate type is required'],
      enum: {
        values: ['birth', 'citizenship', 'residence', 'marriage', 'death', 'income', 'character'],
        message: 'Invalid certificate type',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'under_review', 'approved', 'rejected'],
        message: 'Invalid application status',
      },
      default: 'draft',
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
    },
    applicantDetails: applicantDetailsSchema,
    spouseDetails: applicantDetailsSchema, // Reuse the same schema for spouse
    uploadedDocuments: [uploadedDocumentSchema],
    adminRemarks: {
      type: String,
      trim: true,
      maxlength: [2000, 'Admin remarks cannot exceed 2000 characters'],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    estimatedCompletionDate: {
      type: Date,
      default: null,
    },
    smartFormData: {
      type: mongoose.Schema.Types.Mixed, // AI-extracted data
      default: null,
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
    flagReasons: {
      type: [String],
      default: [],
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
applicationSchema.index({ applicationNumber: 1 }, { unique: true, sparse: true });
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ certificateType: 1 });

// ─── Pre-save: Auto-generate Application Number ───────────────────────────────
applicationSchema.pre('save', async function (next) {
  if (this.isNew && !this.applicationNumber) {
    try {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments();
      const sequence = String(count + 1).padStart(6, '0');
      this.applicationNumber = `APP-${year}-${sequence}`;

      // Set estimated completion date: 7 business days from now
      const completion = new Date();
      completion.setDate(completion.getDate() + 7);
      this.estimatedCompletionDate = completion;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
