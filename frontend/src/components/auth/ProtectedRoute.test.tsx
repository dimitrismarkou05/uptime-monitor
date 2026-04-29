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
});
