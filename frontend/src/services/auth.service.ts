import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ResendOTPRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  GoogleLoginRequest,
} from '../types/auth.types';

/**
 * Login with email and password
 */
export const login = async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.LOGIN,
    data
  );
  return response.data;
};

/**
 * Register a new user
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.REGISTER,
    data
  );
  return response.data;
};

/**
 * Register a technician with KYC documents (multipart form data)
 */
export const registerTechnician = async (data: FormData): Promise<ApiResponse<AuthResponse>> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.REGISTER,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Verify email with OTP code
 */
export const verifyEmail = async (data: VerifyEmailRequest): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.AUTH.VERIFY_EMAIL,
    data
  );
  return response.data;
};

/**
 * Resend OTP code
 */
export const resendOTP = async (data: ResendOTPRequest): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.AUTH.RESEND_OTP,
    data
  );
  return response.data;
};

/**
 * Logout user
 */
export const logout = async (): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(API_ENDPOINTS.AUTH.LOGOUT);
  return response.data;
};

/**
 * Request password reset OTP
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Reset password with OTP code
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Login with Google OAuth token (not implemented in backend yet)
 */
export const googleLogin = async (_data: GoogleLoginRequest): Promise<ApiResponse<AuthResponse>> => {
  // TODO: Implement when backend supports Google OAuth
  throw new Error('Google login not implemented yet');
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(API_ENDPOINTS.AUTH.REFRESH);
  return response.data;
};
