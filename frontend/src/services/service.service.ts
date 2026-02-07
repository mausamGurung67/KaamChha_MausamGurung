import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { Category } from './category.service';

// ─── Types ───────────────────────────────────────────────
export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: string; // Decimal comes as string from Prisma
  duration: number;
  image?: string | null;
  images?: string[];
  inclusions?: string[];
  createdBy: string;
  isActive: boolean;
  serviceRadius?: number | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
  creator: {
    id: string;
    email: string;
    profile: { name: string; avatar?: string | null } | null;
  };
  reviews?: any[];
}

export interface ServiceListResponse {
  services: ServiceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateServicePayload {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  image?: string;
  images?: string[];
  inclusions?: string[];
  serviceRadius?: number;
}

// ─── API calls ───────────────────────────────────────────

export const listServices = async (params?: {
  categoryId?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: ServiceListResponse }> => {
  const res = await api.get(API_ENDPOINTS.SERVICES.LIST, { params });
  return res.data;
};

export const getServiceById = async (
  id: string
): Promise<{ success: boolean; data: { service: ServiceItem } }> => {
  const res = await api.get(API_ENDPOINTS.SERVICES.GET(id));
  return res.data;
};

export const createService = async (
  data: CreateServicePayload
): Promise<{ success: boolean; data: { service: ServiceItem } }> => {
  const res = await api.post(API_ENDPOINTS.SERVICES.CREATE, data);
  return res.data;
};

export const updateService = async (
  id: string,
  data: Partial<CreateServicePayload> & { isActive?: boolean }
): Promise<{ success: boolean; data: { service: ServiceItem } }> => {
  const res = await api.put(API_ENDPOINTS.SERVICES.UPDATE(id), data);
  return res.data;
};

export const deleteService = async (
  id: string
): Promise<{ success: boolean }> => {
  const res = await api.delete(API_ENDPOINTS.SERVICES.DELETE(id));
  return res.data;
};

export const uploadServiceImage = async (file: File): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post(`${API_ENDPOINTS.UPLOAD.IMAGE}?folder=services`, formData);
  return res.data.data;
};
