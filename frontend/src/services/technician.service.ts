import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { ApiResponse } from '../types/auth.types';

export interface TechnicianStats {
  totalOrders: number;
  pendingOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  averageRating: number;
  totalReviews: number;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface MonthlyData {
  month: string;
  earnings: number;
  jobs: number;
}

export interface RecentOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  service: {
    id: string;
    name: string;
    image?: string;
    category: { id: string; name: string };
  };
  customer: {
    id: string;
    profile: {
      name: string;
      phone: string;
      avatar?: string;
    };
  };
}

export interface TechnicianDashboardData {
  stats: TechnicianStats;
  recentOrders: RecentOrder[];
  monthlyData: MonthlyData[];
}

export interface EarningsData {
  totalEarnings: number;
  totalCompletedOrders: number;
  thisMonthEarnings: number;
  thisMonthOrders: number;
  completedPayments: number;
  completedPaymentCount: number;
  pendingPayments: number;
  pendingPaymentCount: number;
  monthlyChart: MonthlyData[];
  recentPayments: {
    id: string;
    totalAmount: number;
    technicianAmount: number;
    completedAt: string;
    paymentStatus: string;
    service: { name: string };
    customer: { profile: { name: string } };
  }[];
}

export interface TechnicianProfile {
  id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  profile: {
    name: string;
    phone: string;
    avatar?: string;
    address?: string;
    lat?: number;
    lng?: number;
  } | null;
  kyc: {
    status: string;
    documentType?: string;
    documentNumber?: string;
    documentFront?: string;
    documentBack?: string;
    selfie?: string;
    rejectionReason?: string;
    submittedAt?: string;
    verifiedAt?: string;
  } | null;
  _count: {
    technicianOrders: number;
    createdServices: number;
  };
}

export const getDashboard = async (): Promise<ApiResponse<TechnicianDashboardData>> => {
  const response = await api.get(API_ENDPOINTS.TECHNICIAN.DASHBOARD);
  return response.data;
};

export const getProfile = async (): Promise<ApiResponse<{ profile: TechnicianProfile }>> => {
  const response = await api.get(API_ENDPOINTS.TECHNICIAN.PROFILE);
  return response.data;
};

export const updateProfile = async (data: {
  name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}): Promise<ApiResponse<{ profile: TechnicianProfile }>> => {
  const response = await api.patch(API_ENDPOINTS.TECHNICIAN.UPDATE_PROFILE, data);
  return response.data;
};

export const getEarnings = async (): Promise<ApiResponse<EarningsData>> => {
  const response = await api.get(API_ENDPOINTS.TECHNICIAN.EARNINGS);
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post(`${API_ENDPOINTS.UPLOAD.IMAGE}?folder=avatars`, formData);
  return res.data.data;
};
