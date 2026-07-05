'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';

/**
 * ThemeProvider — Client component that initializes theme from localStorage
 * and system preferences, preventing flash of wrong theme.
 *
 * Should be placed high in the component tree (root layout).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialize = useThemeStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

/**
 * Inline script to prevent flash of wrong theme.
 * Renders a <script> tag that runs before React hydration.
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('itbengal-theme');
        var theme = stored || 'system';
        var resolved = theme;
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.classList.add(resolved);
        document.documentElement.setAttribute('data-theme', resolved);
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
