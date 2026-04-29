import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("../api/auth", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../api/users", () => ({
  syncUser: vi.fn(),
}));

import { useAuth } from "./useAuth";
import { useAuthStore } from "../stores/authStore";
import * as authApi from "../api/auth";
import * as usersApi from "../api/users";

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
    localStorage.clear();
  });

  it("login mutation authenticates", async () => {
    vi.mocked(authApi.signIn).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
    } as Awaited<ReturnType<typeof authApi.signIn>>);
    vi.mocked(usersApi.syncUser).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      created_at: new Date().toISOString(),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.login(["a@b.com", "pass"]);
    await waitFor(() => expect(result.current.isLoggingIn).toBe(false));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("register mutation authenticates", async () => {
    vi.mocked(authApi.signUp).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
    } as Awaited<ReturnType<typeof authApi.signUp>>);
    vi.mocked(usersApi.syncUser).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      created_at: new Date().toISOString(),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.register(["a@b.com", "pass"]);
    await waitFor(() => expect(result.current.isRegistering).toBe(false));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("logout mutation clears auth", async () => {
    useAuthStore.getState().setUser({ id: "u1", email: "a@b.com" });
    localStorage.setItem("access_token", "tok");
    vi.mocked(authApi.signOut).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.logout();
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(false),
    );
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});
