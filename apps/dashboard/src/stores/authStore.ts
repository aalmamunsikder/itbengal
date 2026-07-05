'use client';

import { create } from 'zustand';
import { api, ApiRequestError } from '@/lib/api';

/** User shape returned by the auth API */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

/** Registration data */
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Standard API success envelope */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Login response — one of three shapes */
interface LoginResponseData {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  requiresTwoFactor?: boolean;
  requiresVerification?: boolean;
}

interface AuthState {
  /** Currently authenticated user */
  user: User | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Loading state for auth operations */
  isLoading: boolean;
  /** Error message from last auth operation */
  error: string | null;
  /** Whether the login flow requires 2FA verification */
  requiresTwoFactor: boolean;
  /** Whether the login flow requires email verification first */
  requiresVerification: boolean;
  /** Temporary email stored during 2FA flow for resubmission */
  pendingEmail: string | null;
  /** Temporary password stored during 2FA flow for resubmission */
  pendingPassword: string | null;

  /** Log in with email/password and optional 2FA code. Returns true on full success. */
  login: (email: string, password: string, twoFactorCode?: string) => Promise<boolean>;
  /** Register a new account. Returns true on success. */
  register: (data: RegisterData) => Promise<boolean>;
  /** Log out the current user */
  logout: () => Promise<void>;
  /** Refresh the current user session via cookie-based refresh */
  refreshUser: () => Promise<void>;
  /** Verify an email address with a token. Returns true on success. */
  verifyEmail: (token: string) => Promise<boolean>;
  /** Request a password reset email. Returns true on success. */
  forgotPassword: (email: string) => Promise<boolean>;
  /** Reset password with a token. Returns true on success. */
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  /** Manually set the user (e.g. after SSR hydration) */
  setUser: (user: User | null) => void;
  /** Clear any auth error */
  clearError: () => void;
}

/**
 * Extract a human-readable error message from a caught error.
 */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiRequestError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requiresTwoFactor: false,
  requiresVerification: false,
  pendingEmail: null,
  pendingPassword: null,

  login: async (email, password, twoFactorCode?) => {
    set({ isLoading: true, error: null });
    try {
      const body: Record<string, string> = { email, password };
      if (twoFactorCode) {
        body.twoFactorCode = twoFactorCode;
      }

      const response = await api.post<ApiResponse<LoginResponseData>>('/auth/login', body);
      const { data } = response;

      // Handle 2FA requirement
      if (data.requiresTwoFactor) {
        set({
          isLoading: false,
          requiresTwoFactor: true,
          requiresVerification: false,
          pendingEmail: email,
          pendingPassword: password,
        });
        return false;
      }

      // Handle email verification requirement
      if (data.requiresVerification) {
        set({
          isLoading: false,
          requiresTwoFactor: false,
          requiresVerification: true,
          pendingEmail: null,
          pendingPassword: null,
        });
        return false;
      }

      // Full success — user is authenticated
      if (data.user) {
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          requiresTwoFactor: false,
          requiresVerification: false,
          pendingEmail: null,
          pendingPassword: null,
        });
        return true;
      }

      // Unexpected response shape
      set({ isLoading: false, error: 'Unexpected response from server.' });
      return false;
    } catch (err) {
      const message = getErrorMessage(err, 'An unexpected error occurred. Please try again.');
      set({
        isLoading: false,
        error: message,
        requiresTwoFactor: false,
        requiresVerification: false,
      });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post<ApiResponse<{ user: User }>>('/auth/register', data);
      set({
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err) {
      const message = getErrorMessage(err, 'Registration failed. Please try again.');
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue with local logout even if API call fails
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        requiresTwoFactor: false,
        requiresVerification: false,
        pendingEmail: null,
        pendingPassword: null,
      });
    }
  },

  refreshUser: async () => {
    set({ isLoading: true });
    try {
      const response = await api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
        '/auth/refresh',
      );
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  verifyEmail: async (token) => {
    set({ isLoading: true, error: null });
    try {
      await api.post<ApiResponse<undefined>>('/auth/verify-email', { token });
      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = getErrorMessage(err, 'Email verification failed. The link may have expired.');
      set({ isLoading: false, error: message });
      return false;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await api.post<ApiResponse<undefined>>('/auth/forgot-password', { email });
      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to send reset email. Please try again.');
      set({ isLoading: false, error: message });
      return false;
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post<ApiResponse<undefined>>('/auth/reset-password', { token, newPassword });
      set({ isLoading: false, error: null });
      return true;
    } catch (err) {
      const message = getErrorMessage(err, 'Password reset failed. The link may have expired.');
      set({ isLoading: false, error: message });
      return false;
    }
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: user !== null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
