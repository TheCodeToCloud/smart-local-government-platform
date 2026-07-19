// ─── Enums / Union Types ──────────────────────────────────────────────────────
export type CertificateType =
  | 'birth'
  | 'citizenship'
  | 'residence'
  | 'marriage'
  | 'death'
  | 'income'
  | 'character';

export type ApplicationStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type UserRole = 'user' | 'admin';

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  citizenshipNumber?: string;
  role: UserRole;
  profilePhoto?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Auth State ───────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Application ──────────────────────────────────────────────────────────────
export interface ApplicantDetails {
  fullName: string;
  dateOfBirth?: string;
  citizenshipNumber?: string;
  gender?: 'male' | 'female' | 'other';
  fatherName?: string;
  motherName?: string;
  grandfatherName?: string;
  permanentAddress?: string;
  temporaryAddress?: string;
  wardNumber?: string;
  municipalityName?: string;
  districtName?: string;
  province?:
    | 'Koshi'
    | 'Madhesh'
    | 'Bagmati'
    | 'Gandaki'
    | 'Lumbini'
    | 'Sudurpashchim';
}

export type SpouseDetails = ApplicantDetails;

export interface UploadedDocument {
  documentType: string;
  cloudinaryUrl: string;
  publicId: string;
  fileName: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface Application {
  _id: string;
  applicationNumber: string;
  userId: string | User;
  certificateType: CertificateType;
  status: ApplicationStatus;
  priority: 'normal' | 'urgent';
  applicantDetails: ApplicantDetails;
  spouseDetails?: SpouseDetails;
  uploadedDocuments: UploadedDocument[];
  adminRemarks?: string;
  rejectionReason?: string;
  reviewedBy?: string | User;
  reviewedAt?: string;
  estimatedCompletionDate?: string;
  smartFormData?: Record<string, unknown>;
  flaggedForReview?: boolean;
  flagReasons?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Certificate ──────────────────────────────────────────────────────────────
export interface Certificate {
  _id: string;
  certificateNumber: string;
  applicationId: string | Application;
  userId: string | User;
  certificateType: CertificateType;
  issuedDate: string;
  expiryDate: string;
  pdfUrl?: string;
  qrCodeUrl?: string;
  qrCodeData?: string;
  isValid: boolean;
  revokedAt?: string;
  revokedReason?: string;
  downloadCount: number;
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  thisMonth: number;
  thisWeek?: number;
  draft?: number;
  approvedToday?: number;
  flaggedCount?: number;
}

export interface DashboardInsights {
  busiestMunicipality: string;
  approvalRate: string;
  rejectionRate: string;
}

export interface RecentActivity {
  action: 'approved' | 'rejected';
  applicationNumber: string;
  certificateType: string;
  adminName: string;
  applicantName: string;
  time: string;
  reason?: string;
}

// ─── Smart Features & Phase 4 ─────────────────────────────────────────────────
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  relatedApplicationId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  addressScore: number;
  documentCompleteness: {
    isComplete: boolean;
    missingDocuments: string[];
    completionPercentage: number;
  };
  smartSuggestions: string[];
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ─── Register / Login payloads ────────────────────────────────────────────────
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  citizenshipNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
