import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as authService from '../services/auth.service';
import type { 
  User, 
  AuthContextType, 
  LoginRequest, 
  RegisterRequest,
  OTPType 
} from '../types/auth.types';
import { STORAGE_KEYS } from '../utils/constants';

// Create the context with undefined as default
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      if (response.success && response.data) {
        setUser(response.data.user);
        // Store token if provided in response
        const tokenData = response.data as unknown as { accessToken?: string };
        if (tokenData.accessToken) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      if (response.success && response.data) {
        setUser(response.data.user);
        // Store token if provided in response
        const tokenData = response.data as unknown as { accessToken?: string };
        if (tokenData.accessToken) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken);
        }
        // Store email for OTP verification page
        localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, data.email);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Even if logout fails on server, clear local state
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
      setIsLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.verifyEmail({ code });
      // Update user state to reflect verified email
      setUser((prev) => prev ? { ...prev, isEmailVerified: true } : null);
      localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (type: OTPType) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resendOTP({ type });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.forgotPassword({ email });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (code: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword({ code, newPassword });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.googleLogin({ token });
      if (response.success && response.data) {
        setUser(response.data.user);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerTechnician = useCallback(async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.registerTechnician(data);
      if (response.success && response.data) {
        setUser(response.data.user);
        // Store email for OTP verification page
        const email = data.get('email') as string;
        if (email) {
          localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isEmailVerified: user?.isEmailVerified ?? false,
    error,
    login,
    register,
    registerTechnician,
    logout,
    verifyEmail,
    resendOTP,
    forgotPassword,
    resetPassword,
    googleLogin,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
