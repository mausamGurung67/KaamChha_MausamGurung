import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { ApiResponse } from '../types/auth.types';

// ── Upload helper ─────────────────────────────────────
export const uploadBookingImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post(`${API_ENDPOINTS.UPLOAD.IMAGE}?folder=bookings`, formData);
  return res.data.data.url;
};

// ── Types ─────────────────────────────────────────────
export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED_BY_TECHNICIAN'
  | 'COMPLETED'
  | 'CANCELLED';

export interface BookingService {
  id: string;
  name: string;
  image?: string;
  price?: number;
  duration?: number;
  category: { id: string; name: string };
}

export interface BookingUser {
  id: string;
  email: string;
  profile: {
    name: string;
    phone?: string;
    avatar?: string;
    address?: string;
  } | null;
}

export interface Booking {
  id: string;
  customerId: string;
  serviceId: string;
  technicianId?: string;
  status: BookingStatus;
  scheduledAt?: string;
  completedAt?: string;
  paymentStatus: string;
  paymentMethod?: string;
  totalAmount: number;
  technicianAmount?: number;
  platformAmount?: number;
  commissionRate?: number;
  serviceLatitude?: number;
  serviceLongitude?: number;
  serviceAddress?: string;
  technicianNotes?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  createdAt: string;
  updatedAt: string;
  service: BookingService;
  customer: BookingUser;
  technician?: BookingUser;
  bookingHistory?: BookingHistoryEntry[];
}

export interface BookingHistoryEntry {
  id: string;
  action: string;
  status?: string;
  notes?: string;
  createdAt: string;
}

export interface BookingListResponse {
  orders: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateBookingData {
  serviceId: string;
  scheduledAt?: string;
  serviceLatitude: number;
  serviceLongitude: number;
  serviceAddress: string;
}

// ── API Calls ─────────────────────────────────────────

export const createBooking = async (data: CreateBookingData): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.post(API_ENDPOINTS.ORDERS.CREATE, data);
  return res.data;
};

export const getBooking = async (id: string): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.get(API_ENDPOINTS.ORDERS.GET(id));
  return res.data;
};

export const listBookings = async (params?: {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<BookingListResponse>> => {
  const res = await api.get(API_ENDPOINTS.ORDERS.LIST, { params });
  return res.data;
};

export const cancelBooking = async (id: string, reason?: string): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.post(API_ENDPOINTS.ORDERS.CANCEL(id), { reason });
  return res.data;
};

// Technician actions
export const acceptBooking = async (id: string): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.post(API_ENDPOINTS.ORDERS.ACCEPT(id));
  return res.data;
};

export const rejectBooking = async (id: string, reason?: string): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.post(API_ENDPOINTS.ORDERS.REJECT(id), { reason });
  return res.data;
};

export const updateBookingStatus = async (id: string, status: BookingStatus, notes?: string): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status, notes });
  return res.data;
};

export const completeByTechnician = async (
  id: string,
  data: { notes?: string; beforePhotos?: string[]; afterPhotos?: string[] }
): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.post(API_ENDPOINTS.ORDERS.COMPLETE_TECHNICIAN(id), data);
  return res.data;
};

// Customer confirms
export const confirmCompletion = async (id: string): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.post(API_ENDPOINTS.ORDERS.CONFIRM_COMPLETION(id));
  return res.data;
};

// Admin actions
export const assignTechnician = async (id: string, technicianId: string): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.post(API_ENDPOINTS.ORDERS.ASSIGN(id), { technicianId });
  return res.data;
};

export const autoAssignTechnician = async (id: string): Promise<ApiResponse<{ order: Booking }>> => {
  const res = await api.post(API_ENDPOINTS.ORDERS.AUTO_ASSIGN(id));
  return res.data;
};
