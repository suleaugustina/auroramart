import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  convexUserId: string | null;
  setUser: (user: User | null, convexId?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      convexUserId: null,
      setUser: (user, convexId) => set({
        user,
        isAuthenticated: !!user,
        convexUserId: convexId ?? null,
      }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('_accessToken');
          localStorage.removeItem('_refreshToken');
        }
        set({ user: null, isAuthenticated: false, convexUserId: null });
      },
    }),
    { name: 'am_auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated, convexUserId: s.convexUserId }) }
  )
);
