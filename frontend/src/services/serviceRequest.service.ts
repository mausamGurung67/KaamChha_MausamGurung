import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// ─── Types ────────────────────────────────────────────────

export type ServiceRequestStatus = 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

export interface ServiceRequestItem {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: string | null;
  location: string;
  customerId: string;
  status: ServiceRequestStatus;
  assignedTechnicianId?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    email: string;
    profile: { name: string; avatar?: string | null } | null;
  };
  assignedTechnician?: {
    id: string;
    email: string;
    profile: { name: string; avatar?: string | null } | null;
  } | null;
}

export interface ServiceRequestListResponse {
  serviceRequests: ServiceRequestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateServiceRequestPayload {
  title: string;
  description: string;
  category: string;
  budget?: number;
  location: string;
}

// ─── API calls ────────────────────────────────────────────

export const listServiceRequests = async (params?: {
  status?: ServiceRequestStatus;
  category?: string;
  search?: string;
  customerId?: string;
  assignedTechnicianId?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: ServiceRequestListResponse }> => {
  const res = await api.get(API_ENDPOINTS.SERVICE_REQUESTS.LIST, { params });
  return res.data;
};

export const getServiceRequestById = async (
  id: string
): Promise<{ success: boolean; data: { serviceRequest: ServiceRequestItem } }> => {
  const res = await api.get(API_ENDPOINTS.SERVICE_REQUESTS.GET(id));
  return res.data;
};

export const createServiceRequest = async (
  data: CreateServiceRequestPayload
): Promise<{ success: boolean; data: { serviceRequest: ServiceRequestItem } }> => {
  const res = await api.post(API_ENDPOINTS.SERVICE_REQUESTS.CREATE, data);
  return res.data;
};

export const getMyServiceRequests = async (): Promise<{
  success: boolean;
  data: { serviceRequests: ServiceRequestItem[] };
}> => {
  const res = await api.get(API_ENDPOINTS.SERVICE_REQUESTS.MY_REQUESTS);
  return res.data;
};

export const updateServiceRequestStatus = async (
  id: string,
  status: ServiceRequestStatus
): Promise<{ success: boolean; data: { serviceRequest: ServiceRequestItem } }> => {
  const res = await api.patch(API_ENDPOINTS.SERVICE_REQUESTS.UPDATE_STATUS(id), { status });
  return res.data;
};

export const assignTechnician = async (
  id: string,
  technicianId?: string
): Promise<{ success: boolean; data: { serviceRequest: ServiceRequestItem } }> => {
  const res = await api.patch(API_ENDPOINTS.SERVICE_REQUESTS.ASSIGN(id), {
    technicianId,
  });
  return res.data;
};

export const deleteServiceRequest = async (
  id: string
): Promise<{ success: boolean }> => {
  const res = await api.delete(API_ENDPOINTS.SERVICE_REQUESTS.DELETE(id));
  return res.data;
};
