import { create } from "zustand";

interface AuthState {
  user: { id: string; email: string } | null;
  isAuthenticated: boolean;
  setUser: (user: { id: string; email: string } | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem("access_token");
    set({ user: null, isAuthenticated: false });
  },
}));
