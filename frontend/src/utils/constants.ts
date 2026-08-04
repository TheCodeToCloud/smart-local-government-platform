import { CertificateType, ApplicationStatus } from '../types';

export const CERTIFICATE_TYPES: Record<CertificateType, { label: string, nepaliLabel: string, icon: string, processingDays: string, requiredDocuments: string[] }> = {
  birth: { 
    label: 'Birth Certificate', 
    nepaliLabel: 'जन्म दर्ता', 
    icon: '🧒', 
    processingDays: '3-5', 
    requiredDocuments: ['Parent citizenship copy', 'Hospital birth record', 'Parent marriage certificate'] 
  },
  citizenship: { 
    label: 'Citizenship Certificate', 
    nepaliLabel: 'नागरिकता', 
    icon: '🪪', 
    processingDays: '7-10', 
    requiredDocuments: ['Birth certificate', 'School certificate (SLC/SEE)', "Parent's citizenship"] 
  },
  residence: { 
    label: 'Residence Certificate', 
    nepaliLabel: 'बसोबास प्रमाणपत्र', 
    icon: '🏠', 
    processingDays: '3-5', 
    requiredDocuments: ['Citizenship copy', 'Utility bill or Ward letter'] 
  },
  marriage: { 
    label: 'Marriage Certificate', 
    nepaliLabel: 'विवाह दर्ता', 
    icon: '💒', 
    processingDays: '5-7', 
    requiredDocuments: ['Both citizenship copies', 'Witness citizenship copies', 'Marriage photo'] 
  },
  death: { 
    label: 'Death Certificate', 
    nepaliLabel: 'मृत्यु दर्ता', 
    icon: '📋', 
    processingDays: '3-5', 
    requiredDocuments: ['Hospital death record or witness letter', 'Deceased citizenship', 'Applicant citizenship'] 
  },
  income: { 
    label: 'Income Certificate', 
    nepaliLabel: 'आय प्रमाणपत्र', 
    icon: '💰', 
    processingDays: '3-5', 
    requiredDocuments: ['Citizenship copy', 'Tax clearance or salary slip'] 
  },
  character: { 
    label: 'Character Certificate', 
    nepaliLabel: 'चरित्र प्रमाणपत्र', 
    icon: '📝', 
    processingDays: '2-3', 
    requiredDocuments: ['Citizenship copy', 'Application letter'] 
  }
};

export const PROVINCES_OF_NEPAL = [
  'Koshi Province', 
  'Madhesh Province', 
  'Bagmati Province', 
  'Gandaki Province', 
  'Lumbini Province', 
  'Karnali Province', 
  'Sudurpashchim Province'
];

export const STATUS_COLORS: Record<ApplicationStatus | 'valid' | 'expired', string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  verified: 'bg-teal-100 text-teal-800',
  returned_for_correction: 'bg-orange-100 text-orange-800',
  valid: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
};

export const REJECTION_REASONS = [
  'Incomplete documents', 
  'Invalid or unclear information', 
  'Documents not legible', 
  'Duplicate application', 
  'Ineligible applicant', 
  'Other'
];
