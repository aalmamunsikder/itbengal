'use client';

import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  /** Current theme preference */
  theme: Theme;
  /** Resolved theme (light or dark) after system preference */
  resolvedTheme: 'light' | 'dark';
  /** Set the theme preference */
  setTheme: (theme: Theme) => void;
  /** Initialize theme from localStorage and system preference */
  initialize: () => void;
}

/**
 * Resolve the effective theme based on preference and system setting.
 */
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply the theme to the document element.
 */
function applyTheme(resolvedTheme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
  root.setAttribute('data-theme', resolvedTheme);

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      resolvedTheme === 'dark' ? '#020617' : '#ffffff',
    );
  }
}

const STORAGE_KEY = 'itbengal-theme';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  resolvedTheme: 'light',

  setTheme: (theme) => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);

    // Persist preference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }

    set({ theme, resolvedTheme: resolved });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;

    // Read persisted preference
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const theme = stored ?? 'system';
    const resolved = resolveTheme(theme);
    applyTheme(resolved);

    set({ theme, resolvedTheme: resolved });

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const currentTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (currentTheme === 'system' || currentTheme === null) {
        const newResolved = resolveTheme('system');
        applyTheme(newResolved);
        set({ resolvedTheme: newResolved });
      }
    };

    mediaQuery.addEventListener('change', handler);
  },
}));
