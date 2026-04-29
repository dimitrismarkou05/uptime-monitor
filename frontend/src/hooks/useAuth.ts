import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signIn, signOut, signUp } from "../api/auth";
import { syncUser } from "../api/users";
import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const queryClient = useQueryClient();
  const {
    user,
    isAuthenticated,
    hasHydrated,
    setUser,
    logout: clearStore,
  } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: Parameters<typeof signIn>) => {
      const authUser = await signIn(...credentials);
      if (authUser) {
        const syncedUser = await syncUser();
        setUser({ id: syncedUser.id, email: syncedUser.email });
      }
      return authUser;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: Parameters<typeof signUp>) => {
      const authUser = await signUp(...credentials);
      if (authUser) {
        const syncedUser = await syncUser();
        setUser({ id: syncedUser.id, email: syncedUser.email });
      }
      return authUser;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      clearStore();
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated,
    hasHydrated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
