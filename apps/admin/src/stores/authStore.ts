'use client';

import { create } from 'zustand';
import { api, ApiRequestError } from '@/lib/api';

/** Admin user shape */
interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

/** Login credentials */
interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AdminUser | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ user: AdminUser }>('/admin/auth/login', credentials);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/admin/auth/logout');
    } catch {
      // Continue with local logout
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  refreshUser: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<{ user: AdminUser }>('/admin/auth/me');
      set({
        user: response.user,
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
