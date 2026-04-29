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
    const result = requestFn(config);
    expect(result.headers.Authorization).toBe("Bearer tok123");
  });

  it("request interceptor skips token when absent", async () => {
    await import("./client");

    const [requestFn] = mockRequestUse.mock.calls[0];
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = requestFn(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it("response interceptor triggers logout on 401", async () => {
    const { useAuthStore } = await import("../stores/authStore");
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
      setUser: vi.fn(),
      setHasHydrated: vi.fn(),
      logout: mockLogout,
    });

    await import("./client");

    const [, errorFn] = mockResponseUse.mock.calls[0];
    const error = { response: { status: 401 } } as AxiosError;

    await expect(errorFn(error)).rejects.toEqual(error);
    expect(mockLogout).toHaveBeenCalled();
  });
});
