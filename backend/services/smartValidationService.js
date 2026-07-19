/**
 * Smart Validation Service for Government Applications
 * Rule-based validation providing scores, missing fields, and suggestions.
 */

const Application = require('../models/Application');

// Required documents per certificate type mapping
const REQUIRED_DOCUMENTS = {
  birth: ['citizenship_parent', 'hospital_record', 'ward_recommendation'],
  citizenship: ['birth_certificate', 'parent_citizenship', 'ward_recommendation'],
  residence: ['citizenship', 'land_ownership', 'ward_recommendation'],
  marriage: ['citizenship_husband', 'citizenship_wife', 'ward_recommendation'],
  death: ['citizenship_deceased', 'informant_citizenship', 'hospital_record'],
  income: ['citizenship', 'tax_clearance', 'business_registration'],
  character: ['citizenship', 'police_report', 'ward_recommendation']
};

/**
 * Validates the full application payload
 */
const validateApplicationData = (certificateType, applicantDetails, uploadedDocuments = []) => {
  let isValid = true;
  const warnings = [];
  const errors = [];
  const smartSuggestions = [];

  if (!applicantDetails || typeof applicantDetails !== 'object') {
    return {
      isValid: false,
      errors: ['Applicant details are entirely missing.'],
      warnings: [],
      addressScore: 0,
      documentCompleteness: { isComplete: false, missingDocuments: [], completionPercentage: 0 },
      smartSuggestions: []
    };
  }

  // 1. Name Validation
  if (!applicantDetails.fullName) {
    errors.push('Full name is required.');
    isValid = false;
  } else {
    const nameStr = applicantDetails.fullName.trim();
    if (nameStr.split(' ').length < 2) {
      warnings.push('Name appears incomplete (missing surname?).');
    }
    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(nameStr)) {
      errors.push('Name cannot contain numbers or special characters.');
      isValid = false;
    }
  }

  // 2. Date Logic
  if (applicantDetails.dateOfBirth) {
    const dob = new Date(applicantDetails.dateOfBirth);
    const now = new Date();
    
    if (dob > now) {
      errors.push('Date of birth cannot be in the future.');
      isValid = false;
    }

    const age = (now - dob) / (1000 * 60 * 60 * 24 * 365.25);
    if (age > 120) {
      errors.push('Date of birth exceeds maximum plausible age (120 years).');
      isValid = false;
    }

    if (certificateType === 'marriage' && age < 20) {
      errors.push('Legal age for marriage in Nepal is 20 years.');
      isValid = false;
    }
  }

  // 3. Address Completeness Score
  let addressScore = 0;
  const missingAddressFields = [];

  if (applicantDetails.province) addressScore += 20; else missingAddressFields.push('Province');
  if (applicantDetails.districtName) addressScore += 20; else missingAddressFields.push('District');
  if (applicantDetails.municipalityName) addressScore += 20; else missingAddressFields.push('Municipality');
  if (applicantDetails.wardNumber) addressScore += 20; else missingAddressFields.push('Ward Number');
  if (applicantDetails.permanentAddress) addressScore += 20; else missingAddressFields.push('Street/Tole');

  if (addressScore < 100) {
    smartSuggestions.push(`Adding missing address details (${missingAddressFields.join(', ')}) speeds up the verification process.`);
  }

  // 4. Document Sufficiency Check
  const requiredDocsForType = REQUIRED_DOCUMENTS[certificateType] || [];
  
  // Create a normalized list of uploaded document types
  const uploadedDocTypes = uploadedDocuments.map(d => d.documentType?.toLowerCase());
  
  const missingDocuments = requiredDocsForType.filter(reqDoc => {
    // Check if the required document keyword is included in any uploaded doc type
    return !uploadedDocTypes.some(upDoc => upDoc && upDoc.includes(reqDoc.toLowerCase()));
  });

  const completionPercentage = requiredDocsForType.length === 0 
    ? 100 
    : Math.round(((requiredDocsForType.length - missingDocuments.length) / requiredDocsForType.length) * 100);
  
  const isComplete = missingDocuments.length === 0;

  if (!isComplete) {
    warnings.push(`Missing ${missingDocuments.length} required document(s) for ${certificateType} certificate.`);
    smartSuggestions.push(`Please upload: ${missingDocuments.map(d => d.replace('_', ' ')).join(', ')}.`);
  }

  // 5. OCR Data Cross-Check
  if (applicantDetails.ocrCitizenshipNumber && applicantDetails.citizenshipNumber) {
    if (applicantDetails.ocrCitizenshipNumber !== applicantDetails.citizenshipNumber) {
      warnings.push("Document details don't match entered details — please review.");
    }
  }

  // Final check - if there are any errors, it's not valid
  if (errors.length > 0) {
    isValid = false;
  }

  return {
    isValid,
    warnings,
    errors,
    addressScore,
    documentCompleteness: {
      isComplete,
      missingDocuments,
      completionPercentage
    },
    smartSuggestions
  };
};

// ─── 2. Anomaly Detection ──────────────────────────────────────────────────────────
const detectAnomalies = async (userId, applicantDetails, certificateType) => {
  let isFlagged = false;
  let flagReasons = [];

  try {
    // Rule 1: Duplicate citizenship number used by a DIFFERENT user in an approved app (Identity Fraud Risk)
    if (applicantDetails.citizenshipNumber) {
      const existingApp = await Application.findOne({
        'applicantDetails.citizenshipNumber': applicantDetails.citizenshipNumber,
        status: 'approved',
        userId: { $ne: userId }
      });
      if (existingApp) {
        isFlagged = true;
        flagReasons.push('Duplicate citizenship number found on an approved application by another user.');
      }
    }

    // Rule 2: Same user > 3 apps for SAME certificateType within 30 days (Spam/Abuse Risk)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAppsCount = await Application.countDocuments({
      userId,
      certificateType,
      createdAt: { $gte: thirtyDaysAgo }
    });
    if (recentAppsCount >= 3) {
      isFlagged = true;
      flagReasons.push(`High submission frequency: User has submitted ${recentAppsCount} ${certificateType} applications in the last 30 days.`);
    }

    // Rule 3: Age constraints
    if (applicantDetails.dateOfBirth) {
      const dob = new Date(applicantDetails.dateOfBirth);
      const ageDiffMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDiffMs); 
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);

      if (certificateType === 'citizenship' && age < 16) {
        isFlagged = true;
        flagReasons.push(`Applicant age is ${age}, but citizenship typically requires 16+ years.`);
      } else if (certificateType === 'marriage' && age < 20) {
        isFlagged = true;
        flagReasons.push(`Applicant age is ${age}, but marriage certificate typically requires 20+ years.`);
      }
    }
  } catch (error) {
    console.error('Error during anomaly detection:', error);
    // Do not block application submission if anomaly detection fails
  }

  return { flaggedForReview: isFlagged, flagReasons };
};

module.exports = {
  validateApplicationData,
  detectAnomalies
};
