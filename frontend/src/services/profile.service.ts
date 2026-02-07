import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { ApiResponse } from '../types/auth.types';

export interface ProfileData {
  id: string;
  userId: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export const getProfile = async (): Promise<ApiResponse<{ profile: any }>> => {
  const response = await api.get(API_ENDPOINTS.PROFILE.GET);
  return response.data;
};

export const updateProfile = async (data: UpdateProfilePayload): Promise<ApiResponse<{ profile: ProfileData }>> => {
  const response = await api.patch(API_ENDPOINTS.PROFILE.UPDATE, data);
  return response.data;
};
