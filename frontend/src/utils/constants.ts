// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH: '/auth/refresh',
  },
  
  // Categories
  CATEGORIES: {
    LIST: '/categories',
    GET: (id: string) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`,
  },
  
  // Services
  SERVICES: {
    LIST: '/services',
    GET: (id: string) => `/services/${id}`,
    CREATE: '/services',
    UPDATE: (id: string) => `/services/${id}`,
    DELETE: (id: string) => `/services/${id}`,
    MY_SERVICES: '/services/my/services',
  },
  
  // Orders / Bookings
  ORDERS: {
    LIST: '/orders',
    GET: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    ACCEPT: (id: string) => `/orders/${id}/accept`,
    REJECT: (id: string) => `/orders/${id}/reject`,
    COMPLETE_TECHNICIAN: (id: string) => `/orders/${id}/complete-technician`,
    CONFIRM_COMPLETION: (id: string) => `/orders/${id}/confirm-completion`,
    ASSIGN: (id: string) => `/orders/${id}/assign`,
    AUTO_ASSIGN: (id: string) => `/orders/${id}/auto-assign`,
  },
  
  // Customer
  CUSTOMER: {
    DASHBOARD: '/customer/dashboard',
    PROFILE: '/customer/profile',
    UPDATE_PROFILE: '/customer/profile',
  },
  
  // Technician
  TECHNICIAN: {
    DASHBOARD: '/technician/dashboard',
    PROFILE: '/technician/profile',
    UPDATE_PROFILE: '/technician/profile',
    EARNINGS: '/technician/earnings',
  },

  // Profile (general - any authenticated user)
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
  },
  
  // Location
  LOCATION: {
    UPDATE: '/location',
    HISTORY: '/location/history',
    NEARBY_TECHNICIANS: '/location/technicians/nearby',
  },
  
  // KYC
  KYC: {
    SUBMIT: '/kyc',
    GET_MY: '/kyc/my',
    LIST: '/kyc',
    GET: (id: string) => `/kyc/${id}`,
    VERIFY: (id: string) => `/kyc/${id}/verify`,
  },
  
  // Admin
  ADMIN: {
    USERS: {
      LIST: '/admin/users',
      GET: (id: string) => `/admin/users/${id}`,
      UPDATE: (id: string) => `/admin/users/${id}`,
      DELETE: (id: string) => `/admin/users/${id}`,
      UNLOCK: (id: string) => `/admin/users/${id}/unlock`,
    },
    TECHNICIANS: {
      LIST: '/admin/technicians',
      STATS: '/admin/technicians/stats',
    },
    STATS: {
      PLATFORM: '/admin/stats/platform',
      REVENUE: '/admin/stats/revenue',
      ORDERS: '/admin/stats/orders',
      USERS: '/admin/stats/users',
      TECHNICIANS_PERFORMANCE: '/admin/stats/technicians/performance',
    },
  },
  
  // Upload
  UPLOAD: {
    IMAGE: '/upload/image',
  },

  // Payments
  PAYMENTS: {
    KHALTI: {
      INITIATE: '/payments/khalti/initiate',
      VERIFY: '/payments/khalti/verify',
    },
  },
  
  // Health
  HEALTH: '/health',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  PENDING_EMAIL: 'pendingEmail',
} as const;

// OTP Configuration
export const OTP_RESEND_COOLDOWN = 60; // seconds
export const OTP_LENGTH = 6;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Map Configuration
export const DEFAULT_MAP_CENTER = {
  lat: 27.7172,
  lng: 85.3240, // Kathmandu, Nepal
};
export const DEFAULT_MAP_ZOOM = 13;
export const SERVICE_RADIUS_METERS = 5000; // 5km

// Time Configuration
export const DATE_FORMAT = 'MMM DD, YYYY';
export const TIME_FORMAT = 'hh:mm A';
export const DATETIME_FORMAT = 'MMM DD, YYYY hh:mm A';

// Status Colors
export const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED_BY_TECHNICIAN: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
} as const;

export const PAYMENT_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
} as const;

export const KYC_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
} as const;
