import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { ApiResponse } from '../types/auth.types';
import type { Booking } from './booking.service';

// ── Types ─────────────────────────────────────────────

export interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
}

export interface KhaltiVerifyResponse {
  order: Booking;
}

// ── API Calls ─────────────────────────────────────────

/**
 * Initiate Khalti payment for an order.
 * Returns a payment URL to redirect the customer to.
 */
export const initiateKhaltiPayment = async (
  orderId: string
): Promise<ApiResponse<KhaltiInitiateResponse>> => {
  const res = await api.post(API_ENDPOINTS.PAYMENTS.KHALTI.INITIATE, { orderId });
  return res.data;
};

/**
 * Verify Khalti payment after callback redirect.
 * Called with the pidx + orderId from the callback URL params.
 */
export const verifyKhaltiPayment = async (
  pidx: string,
  orderId: string
): Promise<ApiResponse<KhaltiVerifyResponse>> => {
  const res = await api.post(API_ENDPOINTS.PAYMENTS.KHALTI.VERIFY, { pidx, orderId });
  return res.data;
};
