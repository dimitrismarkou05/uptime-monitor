import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";

const mockRequestUse = vi.fn();
const mockResponseUse = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: mockRequestUse },
        response: { use: mockResponseUse },
      },
      defaults: { headers: {} },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

const mockLogout = vi.fn();

vi.mock("../stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
      setUser: vi.fn(),
      setHasHydrated: vi.fn(),
      logout: mockLogout,
    })),
  },
}));

vi.mock("./auth", async () => {
  const actual = await vi.importActual<typeof import("./auth")>("./auth");
  return {
    ...actual,
    isTokenExpiringSoon: vi.fn(() => false),
    refreshSession: vi.fn(),
  };
});

describe("apiClient", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequestUse.mockClear();
    mockResponseUse.mockClear();
    mockLogout.mockClear();
    localStorage.clear();
  });

  it("request interceptor adds token when present", async () => {
    localStorage.setItem("access_token", "tok123");
    await import("./client");

    const [requestFn] = mockRequestUse.mock.calls[0];
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = await requestFn(config);
    expect(result.headers.Authorization).toBe("Bearer tok123");
  });

  it("request interceptor skips token when absent", async () => {
    await import("./client");

    const [requestFn] = mockRequestUse.mock.calls[0];
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = await requestFn(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it("response interceptor triggers logout on 401 when refresh fails", async () => {
    const { useAuthStore } = await import("../stores/authStore");
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
      setUser: vi.fn(),
      setHasHydrated: vi.fn(),
      logout: mockLogout,
    });

    const { refreshSession } = await import("./auth");
    vi.mocked(refreshSession).mockRejectedValue(new Error("refresh failed"));

    await import("./client");

    const [, errorFn] = mockResponseUse.mock.calls[0];
    const error = {
      response: { status: 401 },
      config: { _retry: false },
    } as unknown as AxiosError;

    await expect(errorFn(error)).rejects.toThrow("refresh failed");
    expect(mockLogout).toHaveBeenCalled();
  });

  it("proactively refreshes token when expiring soon", async () => {
    const { isTokenExpiringSoon, refreshSession } = await import("./auth");
    vi.mocked(isTokenExpiringSoon).mockReturnValue(true);
    vi.mocked(refreshSession).mockResolvedValue("new-tok");

    await import("./client");

    const [requestFn] = mockRequestUse.mock.calls[0];
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = await requestFn(config);
    expect(result.headers.Authorization).toBe("Bearer new-tok");
  });

  it("queues concurrent requests during refresh", async () => {
    const { refreshSession } = await import("./auth");
    let resolveRefresh: (value: string) => void;
    vi.mocked(refreshSession).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    await import("./client");

    const [, errorFn] = mockResponseUse.mock.calls[0];
    const error = {
      response: { status: 401 },
      config: { _retry: false },
    } as unknown as AxiosError;

    const p1 = errorFn(error);
    const p2 = errorFn(error);

    resolveRefresh!("new-tok");

    const r1 = await p1;
    const r2 = await p2;
    expect(r1.headers.Authorization).toBe("Bearer new-tok");
    expect(r2.headers.Authorization).toBe("Bearer new-tok");
  });
});
