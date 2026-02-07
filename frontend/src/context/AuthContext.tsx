import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import * as authService from '../services/auth.service';
import { resetAuthInterceptor } from '../services/api';
import type { 
  User, 
  AuthContextType, 
  LoginRequest, 
  RegisterRequest,
  OTPType 
} from '../types/auth.types';
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';
import api from '../services/api';

// Create the context with undefined as default
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionChecked = useRef(false);

  // On mount: if localStorage has a user, validate the session with the server.
  // If the session is invalid (refresh fails), clear the user immediately
  // instead of letting ProtectedRoute render → 401 → refresh loop.
  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    let parsed: User | null = null;
    try {
      parsed = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.USER);
      setIsLoading(false);
      return;
    }

    // Attempt to refresh the access token to verify session is still alive.
    // This is a single request — if it fails, we know the session is dead.
    api.post(API_ENDPOINTS.AUTH.REFRESH)
      .then(() => {
        // Session is valid — set the user
        setUser(parsed);
        setIsLoading(false);
      })
      .catch(() => {
        // Session is dead — clean up everything
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        setUser(null);
        setIsLoading(false);
      });
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
        // Reset the interceptor's logged-out flag so refresh works again
        resetAuthInterceptor();
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
        resetAuthInterceptor();
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
        resetAuthInterceptor();
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

  const registerTechnician = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.registerTechnician(data);
      if (response.success && response.data) {
        resetAuthInterceptor();
        setUser(response.data.user);
        // Store email for OTP verification page
        const email = data.email;
        localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
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
    setUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
