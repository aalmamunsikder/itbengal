'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItemType = 'DOMAIN' | 'HOSTING' | 'ADDON';

export interface CartItem {
  id: string; // Unique identifier (e.g. `domain:example.com`)
  type: CartItemType;
  name: string; // Display name
  priceBdt: number;
  metadata: Record<string, any>; // Extra info (e.g. tld, planType, siteTitle)
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Prevent duplicates (e.g., adding the same domain twice)
          const exists = state.items.some((i) => i.id === item.id);
          if (exists) return state;
          return { items: [...state.items, item] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getCartTotal: () => {
        return get().items.reduce((sum, item) => sum + item.priceBdt, 0);
      },
    }),
    {
      name: 'itbengal-cart-storage',
    }
  )
);
