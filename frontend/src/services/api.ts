import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  User,
  Application,
  Certificate,
  RegisterPayload,
  LoginPayload,
  DashboardStats,
} from '../types';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach Token ───────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: RegisterPayload) =>
    api.post<ApiResponse<{ user: User }>>('/auth/register', data),

  login: (data: LoginPayload) =>
    api.post<ApiResponse<{ user: User }>>('/auth/login', data),

  getMe: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),

  updateProfile: (data: Partial<Pick<User, 'fullName' | 'phone' | 'address' | 'citizenshipNumber'>>) =>
    api.put<ApiResponse<{ user: User }>>('/auth/update-profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse>('/auth/change-password', data),

  uploadPhoto: (formData: FormData) =>
    api.post<ApiResponse<{ user: User }>>('/auth/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Application API ──────────────────────────────────────────────────────────
export const applicationAPI = {
  create: (data: Partial<Application>) =>
    api.post<ApiResponse<{ application: Application }>>('/applications', data),

  getAll: (params?: { status?: string; certificateType?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<{
      applications: Application[];
      total: number;
      page: number;
      totalPages: number;
      pagination?: unknown;
    }>>('/applications', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<{ application: Application }>>(`/applications/${id}`),

  update: (id: string, data: Partial<Application>) =>
    api.put<ApiResponse<{ application: Application }>>(`/applications/${id}`, data),

  deleteApp: (id: string) =>
    api.delete<ApiResponse>(`/applications/${id}`),

  uploadDocument: (id: string, formData: FormData) =>
    api.post<ApiResponse<{ document: any }>>(`/applications/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  extractDocument: (formData: FormData) =>
    api.post<ApiResponse<any>>(`/applications/extract-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getEstimate: (certificateType: string, priority: string) =>
    api.get<ApiResponse<{ estimatedDays: string, historicalCount: number, formula: string }>>('/applications/estimate', {
      params: { certificateType, priority }
    }),

  validateApplication: (id: string, data: { certificateType: string; applicantDetails: any; uploadedDocuments?: any[] }) =>
    api.post<ApiResponse<import('../types').ValidationResult>>(`/applications/validate`, data),
};


// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
  getAllApplications: (params?: {
    status?: string;
    certificateType?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<ApiResponse<{ applications: Application[]; pagination: unknown }>>(
      '/admin/applications',
      { params }
    ),

  approveApplication: (id: string, data?: { adminRemarks?: string }) =>
    api.put<ApiResponse<{ application: Application; certificate: Certificate; pdfUrl: string }>>(
      `/admin/applications/${id}/approve`,
      data
    ),

  rejectApplication: (id: string, data: { rejectionReason: string; adminRemarks?: string }) =>
    api.put<ApiResponse<{ application: Application }>>(
      `/admin/applications/${id}/reject`,
      data
    ),

  setUnderReview: (id: string) =>
    api.put<ApiResponse<{ application: Application }>>(
      `/admin/applications/${id}/review`
    ),

  getStats: () =>
    api.get<ApiResponse<{ 
      stats: DashboardStats; 
      totalUsers: number; 
      totalCerts: number;
      recentActivity?: any[];
      certTypeDistribution?: any[];
      avgProcessingDays?: number;
      insights?: import('../types').DashboardInsights;
    }>>('/admin/stats'),

  getAllUsers: (params?: { role?: string; isActive?: string | boolean; search?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<{ users: User[]; pagination: unknown }>>(
      '/admin/users',
      { params }
    ),
    
  toggleUserStatus: (id: string) =>
    api.put<ApiResponse<{ user: User }>>(
      `/admin/users/${id}/toggle-status`
    ),
};

// ─── Certificate API ──────────────────────────────────────────────────────────
export const certificateAPI = {
  getAll: () =>
    api.get<ApiResponse<{ certificates: Certificate[] }>>('/certificates'),

  download: (id: string) =>
    api.get<Blob>(`/certificates/${id}/download`, { responseType: 'blob' }),

  verify: (certNumber: string) =>
    api.get<ApiResponse<{ certificateNumber?: string; holderName?: string; certificateType?: string; issuedDate?: string; expiryDate?: string; isValid: boolean; message?: string; revokedReason?: string }>>(
      `/certificates/verify/${certNumber}`
    ),
};

// ─── Notification API ─────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: () =>
    api.get<ApiResponse<{ notifications: import('../types').Notification[] }>>('/notifications'),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.put<ApiResponse<{ notification: import('../types').Notification }>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<ApiResponse<{ message: string }>>('/notifications/mark-all-read'),
};

// ─── Assistant API ────────────────────────────────────────────────────────────
export const assistantAPI = {
  getGuidance: (query: string) =>
    api.post<ApiResponse<{ 
      certificateType: string | null;
      requiredDocuments: string[];
      estimatedDays: string;
      message: string;
    }>>('/assistant/guide', { query }),
};

export default api;
