'use client';

import { create } from 'zustand';

interface SidebarState {
  /** Whether the sidebar is collapsed (desktop) */
  isCollapsed: boolean;
  /** Whether the mobile sidebar drawer is open */
  isMobileOpen: boolean;
  /** Toggle the sidebar collapsed state */
  toggle: () => void;
  /** Set mobile drawer open/closed */
  setMobileOpen: (open: boolean) => void;
  /** Initialize from localStorage */
  initialize: () => void;
}

const STORAGE_KEY = 'itbengal-sidebar-collapsed';

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,

  toggle: () => {
    set((state) => {
      const newCollapsed = !state.isCollapsed;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCollapsed));
      }
      return { isCollapsed: newCollapsed };
    });
  },

  setMobileOpen: (open) => {
    set({ isMobileOpen: open });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      try {
        set({ isCollapsed: JSON.parse(stored) as boolean });
      } catch {
        // Ignore malformed data
      }
    }
  },
}));
