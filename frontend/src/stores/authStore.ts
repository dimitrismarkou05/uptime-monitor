import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: { id: string; email: string } | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setUser: (user: { id: string; email: string } | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_expires_at");
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
