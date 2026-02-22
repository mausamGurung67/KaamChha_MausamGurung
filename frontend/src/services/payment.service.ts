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

// ── eSewa Types ───────────────────────────────────────

export interface EsewaInitiateResponse {
  payment_url: string;
  formData: Record<string, string>;
}

export interface EsewaVerifyResponse {
  order: Booking;
}

// ── eSewa API Calls ───────────────────────────────────

/**
 * Initiate eSewa payment for an order.
 * Returns a payment URL and form data to submit via POST form.
 */
export const initiateEsewaPayment = async (
  orderId: string
): Promise<ApiResponse<EsewaInitiateResponse>> => {
  const res = await api.post(API_ENDPOINTS.PAYMENTS.ESEWA.INITIATE, { orderId });
  return res.data;
};

/**
 * Verify eSewa payment after callback redirect.
 * Called with the base64-encoded response data from eSewa redirect.
 */
export const verifyEsewaPayment = async (
  encodedResponse: string,
  orderId: string
): Promise<ApiResponse<EsewaVerifyResponse>> => {
  const res = await api.post(API_ENDPOINTS.PAYMENTS.ESEWA.VERIFY, { encodedResponse, orderId });
  return res.data;
};
