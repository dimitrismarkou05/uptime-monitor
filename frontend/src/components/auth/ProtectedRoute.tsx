import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { syncUser } from "../../api/users";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, hasHydrated, user, setUser, logout } =
    useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasHydrated) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    if (!user) {
      // Async IIFE — setState only happens in .then()/.catch() callbacks
      (async () => {
        try {
          const syncedUser = await syncUser();
          setUser({ id: syncedUser.id, email: syncedUser.email });
        } catch (err) {
          console.error("Auth sync failed:", err);
          logout();
          navigate("/login", { replace: true });
        }
      })();
    }
  }, [hasHydrated, user, navigate, setUser, logout]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
