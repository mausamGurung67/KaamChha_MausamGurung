import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { ApiResponse } from '../types/auth.types';

export interface KYCData {
  id: string;
  technicianId: string;
  documentType: 'CITIZENSHIP' | 'LICENSE' | 'PASSPORT';
  documentNumber: string;
  documentFront: string;
  documentBack: string;
  selfie: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  submittedAt: string;
}

export const getMyKYC = async (): Promise<ApiResponse<{ kyc: KYCData }>> => {
  const response = await api.get(API_ENDPOINTS.KYC.GET_MY);
  return response.data;
};

export const submitKYC = async (data: {
  documentType: string;
  documentNumber: string;
  documentFront: string;
  documentBack: string;
  selfie: string;
}): Promise<ApiResponse<{ kyc: KYCData }>> => {
  const response = await api.post(API_ENDPOINTS.KYC.SUBMIT, data);
  return response.data;
};
