'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { RegisterData } from '@/stores/authStore';

/**
 * Convenience hook that wraps the auth store with router-aware
 * helpers for login, register, and logout flows.
 *
 * @example
 * ```tsx
 * const { user, isLoading, loginAndRedirect } = useAuth();
 * ```
 */
export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  /**
   * Login and redirect to /dashboard on success.
   * Returns true if login succeeded (user is fully authenticated).
   */
  const loginAndRedirect = useCallback(
    async (email: string, password: string, twoFactorCode?: string): Promise<boolean> => {
      const success = await store.login(email, password, twoFactorCode);
      if (success) {
        router.push('/dashboard');
      }
      return success;
    },
    [store, router],
  );

  /**
   * Register and redirect to a "check your email" confirmation.
   * Returns true if registration succeeded.
   */
  const registerAndRedirect = useCallback(
    async (data: RegisterData): Promise<boolean> => {
      const success = await store.register(data);
      if (success) {
        router.push('/login?registered=true');
      }
      return success;
    },
    [store, router],
  );

  /**
   * Logout and redirect to the login page.
   */
  const logoutAndRedirect = useCallback(async (): Promise<void> => {
    await store.logout();
    router.push('/login');
  }, [store, router]);

  return {
    ...store,
    loginAndRedirect,
    registerAndRedirect,
    logoutAndRedirect,
  };
}
