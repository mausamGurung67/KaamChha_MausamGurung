import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { ApiResponse } from '../types/auth.types';

// ─── Types ───────────────────────────────────────────────
export interface PlatformStats {
  users: {
    total: number;
    customers: number;
    technicians: number;
    admins: number;
    active: number;
  };
  orders: { total: number; pending: number; completed: number };
  revenue: { total: number; platform: number; technician: number };
  services: { total: number; active: number };
  categories: { total: number };
  kyc: { pending: number; approved: number };
  payments: { total: number; successful: number; successRate: number };
}

export interface TechnicianUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  profile: {
    name: string;
    phone: string;
    avatar?: string;
    address?: string;
  } | null;
  kyc: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    documentType: string;
    documentNumber: string;
    documentFront: string;
    documentBack: string;
    selfie: string;
    rejectionReason?: string | null;
    submittedAt: string;
    verifiedAt?: string | null;
  } | null;
  _count: {
    technicianOrders: number;
    createdServices: number;
  };
}

export interface KYCEntry {
  id: string;
  technicianId: string;
  documentType: string;
  documentNumber: string;
  documentFront: string;
  documentBack: string;
  selfie: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  submittedAt: string;
  verifiedAt?: string | null;
  technician: {
    id: string;
    email: string;
    profile: { name: string; phone?: string } | null;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TechnicianStats {
  totalTechnicians: number;
  activeTechnicians: number;
  inactiveTechnicians: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
}

// ─── API calls ───────────────────────────────────────────

export const getPlatformStats = async (): Promise<ApiResponse<PlatformStats>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.STATS.PLATFORM);
  return response.data;
};

export const getTechnicianStats = async (): Promise<ApiResponse<TechnicianStats>> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.TECHNICIANS.STATS);
  return response.data;
};

export const listTechnicians = async (params?: {
  kycStatus?: string;
  isActive?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: TechnicianUser[]; pagination: Pagination }> => {
  const response = await api.get(API_ENDPOINTS.ADMIN.TECHNICIANS.LIST, { params });
  return response.data;
};

export const updateUser = async (
  id: string,
  data: { isActive?: boolean; isLocked?: boolean; role?: string }
): Promise<ApiResponse> => {
  const response = await api.patch(API_ENDPOINTS.ADMIN.USERS.UPDATE(id), data);
  return response.data;
};

export const deleteUser = async (id: string): Promise<ApiResponse> => {
  const response = await api.delete(API_ENDPOINTS.ADMIN.USERS.DELETE(id));
  return response.data;
};

// ─── KYC management ─────────────────────────────────────

export const listKYCs = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: { kycs: KYCEntry[]; total: number; page: number; limit: number; totalPages: number };
}> => {
  const response = await api.get(API_ENDPOINTS.KYC.LIST, { params });
  return response.data;
};

export const getKYCById = async (
  id: string
): Promise<ApiResponse<{ kyc: KYCEntry }>> => {
  const response = await api.get(API_ENDPOINTS.KYC.GET(id));
  return response.data;
};

export const verifyKYC = async (
  id: string,
  data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
): Promise<ApiResponse> => {
  const response = await api.patch(API_ENDPOINTS.KYC.VERIFY(id), data);
  return response.data;
};
