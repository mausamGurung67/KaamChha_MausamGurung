import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { ApiResponse } from '../types/auth.types';

export interface TechnicianStats {
  totalOrders: number;
  pendingOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalEarnings: number;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
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
    rejectionReason?: string;
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
}): Promise<ApiResponse<{ profile: TechnicianProfile }>> => {
  const response = await api.patch(API_ENDPOINTS.TECHNICIAN.UPDATE_PROFILE, data);
  return response.data;
};
