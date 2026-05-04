/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuthStore } from "../../stores/authStore";

vi.mock("../../api/users", () => ({
  syncUser: vi.fn().mockResolvedValue({
    id: "1",
    email: "a@b.com",
    created_at: new Date().toISOString(),
  }),
}));

vi.mock("../../api/auth", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/auth")>("../../api/auth");
  return {
    ...actual,
    isTokenExpiringSoon: vi.fn(),
    refreshSession: vi.fn(),
  };
});

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
    });
  });

  it("shows spinner while hydrating", () => {
    useAuthStore.setState({ hasHydrated: false });
    localStorage.setItem("access_token", "tok");

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>protected</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirects to login when no token", async () => {
    useAuthStore.setState({ hasHydrated: true });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("login page")).toBeInTheDocument();
    });
  });

  it("renders children when authenticated", async () => {
    useAuthStore.setState({
      hasHydrated: true,
      isAuthenticated: true,
      user: { id: "1", email: "a@b.com" },
    });
    localStorage.setItem("access_token", "tok");

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>protected</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("protected")).toBeInTheDocument();
    });
  });

  it("logs out and redirects when syncUser fails", async () => {
    useAuthStore.setState({ hasHydrated: true, user: null });
    localStorage.setItem("access_token", "expired-tok");

    const { syncUser } = await import("../../api/users");
    vi.mocked(syncUser).mockRejectedValue(new Error("Token expired"));

    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(screen.getByText("login page")).toBeInTheDocument();
    });
  });

  it("logs error to console when sync fails", async () => {
    useAuthStore.setState({ hasHydrated: true, user: null });
    localStorage.setItem("access_token", "expired-tok");

    const { syncUser } = await import("../../api/users");
    vi.mocked(syncUser).mockRejectedValue(new Error("Sync failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Auth sync failed:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  it("redirects to login when not authenticated", () => {
    useAuthStore.setState({ isAuthenticated: false, hasHydrated: true });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={<ProtectedRoute>Child</ProtectedRoute>}
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("syncs user when token exists but user is null", async () => {
    useAuthStore.setState({
      hasHydrated: true,
      user: null,
      isAuthenticated: false,
    });
    localStorage.setItem("access_token", "valid-tok");

    const { syncUser } = await import("../../api/users");
    // CRITICAL: Reset any previous rejected mock from other tests
    vi.mocked(syncUser).mockReset();
    vi.mocked(syncUser).mockResolvedValue({
      id: "1",
      email: "a@b.com",
      created_at: new Date().toISOString(),
    });

    const setUserSpy = vi.spyOn(useAuthStore.getState(), "setUser");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(setUserSpy).toHaveBeenCalledWith({ id: "1", email: "a@b.com" });
    });
  });

  it("refreshes token on mount when expiring soon", async () => {
    useAuthStore.setState({
      hasHydrated: true,
      user: null,
      isAuthenticated: false,
    });
    localStorage.setItem("access_token", "expired-tok");
    localStorage.setItem("token_expires_at", String(Date.now() - 1000));

    const { isTokenExpiringSoon, refreshSession } =
      await import("../../api/auth");
    vi.mocked(isTokenExpiringSoon).mockReturnValue(true);
    vi.mocked(refreshSession).mockImplementation(() => {
      throw new Error("sync fail"); // Synchronous throw = immediate catch
    });

    const { syncUser } = await import("../../api/users");
    vi.mocked(syncUser).mockResolvedValue({
      id: "1",
      email: "a@b.com",
      created_at: new Date().toISOString(),
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>protected</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("protected")).toBeInTheDocument();
    });
  });
});
