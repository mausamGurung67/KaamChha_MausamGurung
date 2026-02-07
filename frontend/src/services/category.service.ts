import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { services: number };
}

export const listCategories = async (): Promise<{ success: boolean; data: Category[] }> => {
  const res = await api.get(API_ENDPOINTS.CATEGORIES.LIST);
  return res.data;
};

export const getCategoryById = async (
  id: string
): Promise<{ success: boolean; data: Category }> => {
  const res = await api.get(API_ENDPOINTS.CATEGORIES.GET(id));
  return res.data;
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  image?: string;
}): Promise<{ success: boolean; data: Category }> => {
  const res = await api.post(API_ENDPOINTS.CATEGORIES.CREATE, data);
  return res.data;
};
