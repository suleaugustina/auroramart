import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart } from '@/types';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  setCart: (cart: Cart | null) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: null,
      isOpen: false,
      itemCount: 0,
      subtotal: 0,
      setCart: (cart) => {
        const itemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
        const subtotal = cart?.items?.reduce((s, i) => s + (i.product?.price ?? i.priceAtAdd) * i.quantity, 0) ?? 0;
        set({ cart, itemCount, subtotal });
      },
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    { name: 'am_cart', partialize: (s) => ({ cart: s.cart, itemCount: s.itemCount, subtotal: s.subtotal }) }
  )
);
