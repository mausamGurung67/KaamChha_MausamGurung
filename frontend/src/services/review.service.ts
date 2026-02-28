import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { ApiResponse } from '../types/auth.types';

// ── Types ─────────────────────────────────────────────

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  technicianId: string;
  serviceId: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    profile: { name: string; avatar?: string | null } | null;
  };
  service?: {
    id: string;
    name: string;
  };
}

export interface ReviewWithStats {
  review: Review;
  averageRating: number;
  totalReviews: number;
}

export interface TechnicianReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TechnicianRating {
  averageRating: number;
  totalReviews: number;
}

// ── API calls ─────────────────────────────────────────

export const submitReview = async (
  orderId: string,
  rating: number,
  comment?: string
): Promise<ApiResponse<ReviewWithStats>> => {
  const res = await api.post(API_ENDPOINTS.REVIEWS.CREATE, { orderId, rating, comment });
  return res.data;
};

export const getTechnicianReviews = async (
  technicianId: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<TechnicianReviewsResponse>> => {
  const res = await api.get(API_ENDPOINTS.REVIEWS.TECHNICIAN(technicianId), {
    params: { page, limit },
  });
  return res.data;
};

export const getServiceReviews = async (
  serviceId: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<TechnicianReviewsResponse>> => {
  const res = await api.get(API_ENDPOINTS.REVIEWS.SERVICE(serviceId), {
    params: { page, limit },
  });
  return res.data;
};

export const getOrderReview = async (
  orderId: string
): Promise<ApiResponse<{ review: Review | null }>> => {
  const res = await api.get(API_ENDPOINTS.REVIEWS.ORDER(orderId));
  return res.data;
};

export const canReviewOrder = async (
  orderId: string
): Promise<ApiResponse<{ canReview: boolean }>> => {
  const res = await api.get(API_ENDPOINTS.REVIEWS.CAN_REVIEW(orderId));
  return res.data;
};

export const getTechnicianRating = async (
  technicianId: string
): Promise<ApiResponse<TechnicianRating>> => {
  const res = await api.get(API_ENDPOINTS.REVIEWS.TECHNICIAN_RATING(technicianId));
  return res.data;
};

// ── Admin API calls ───────────────────────────────────

export interface AdminReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  overallStats: {
    averageRating: number;
    totalReviews: number;
  };
}

export const getAdminReviews = async (params?: {
  search?: string;
  rating?: number;
  isApproved?: boolean;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AdminReviewsResponse>> => {
  const res = await api.get(API_ENDPOINTS.REVIEWS.ADMIN_ALL, { params });
  return res.data;
};

export const toggleReviewApproval = async (
  id: string
): Promise<ApiResponse<{ review: Review }>> => {
  const res = await api.patch(API_ENDPOINTS.REVIEWS.ADMIN_TOGGLE(id));
  return res.data;
};

export const deleteReview = async (
  id: string
): Promise<ApiResponse> => {
  const res = await api.delete(API_ENDPOINTS.REVIEWS.ADMIN_DELETE(id));
  return res.data;
};
