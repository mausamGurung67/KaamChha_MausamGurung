// User roles matching backend enum
export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

// OTP types matching backend enum
export type OTPType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN';

// Document types for KYC
export type DocumentType = 'CITIZENSHIP' | 'LICENSE' | 'PASSPORT';

// User object returned from API
export interface User {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  name?: string;
  phone?: string;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// Auth API Responses
export interface AuthResponse {
  user: User;
}

export interface TokenResponse {
  accessToken: string;
}

// Auth API Requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface ResendOTPRequest {
  type: OTPType;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  code: string;
  newPassword: string;
}

export interface GoogleLoginRequest {
  token: string;
}

// Auth Context State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
}

// Auth Context Actions
export interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  registerTechnician: (data: FormData) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendOTP: (type: OTPType) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (code: string, newPassword: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  clearError: () => void;
  error: string | null;
}
