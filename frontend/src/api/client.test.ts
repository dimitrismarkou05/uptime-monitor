import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";

const mockRequestUse = vi.fn();
const mockResponseUse = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => {
      const instance = {
        interceptors: {
          request: { use: mockRequestUse },
          response: { use: mockResponseUse },
        },
        defaults: { headers: {} },
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      };
      // Make the instance callable for request retries
      const callable = vi.fn((config: unknown) =>
        Promise.resolve({ data: {}, headers: {}, config }),
      );
      Object.assign(callable, instance);
      return callable;
    }),
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
      config: { _retry: false, headers: {} },
    } as unknown as AxiosError;

    await expect(errorFn(error)).rejects.toThrow("refresh failed");
    expect(mockLogout).toHaveBeenCalled();
  });

  it("proactively refreshes token when expiring soon", async () => {
    localStorage.setItem("access_token", "expired-tok");
    const { isTokenExpiringSoon, refreshSession } = await import("./auth");
    vi.mocked(isTokenExpiringSoon).mockReturnValue(true);
    vi.mocked(refreshSession).mockResolvedValue("new-tok");

    await import("./client");

    const [requestFn] = mockRequestUse.mock.calls[0];
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = await requestFn(config);
    expect(result.headers.Authorization).toBe("Bearer new-tok");
  });

  it("skips proactive refresh for auth endpoints", async () => {
    localStorage.setItem("access_token", "expired-tok");
    const { isTokenExpiringSoon } = await import("./auth");
    vi.mocked(isTokenExpiringSoon).mockReturnValue(true);

    await import("./client");

    const [requestFn] = mockRequestUse.mock.calls[0];
    const config = {
      headers: {},
      url: "/auth/refresh",
    } as InternalAxiosRequestConfig;
    const result = await requestFn(config);
    // Should attach old token, not try proactive refresh
    expect(result.headers.Authorization).toBe("Bearer expired-tok");
  });

  it("falls through to old token when proactive refresh throws", async () => {
    localStorage.setItem("access_token", "old-tok");
    const { isTokenExpiringSoon, refreshSession } = await import("./auth");
    vi.mocked(isTokenExpiringSoon).mockReturnValue(true);
    vi.mocked(refreshSession).mockRejectedValue(new Error("refresh failed"));

    await import("./client");

    const [requestFn] = mockRequestUse.mock.calls[0];
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const result = await requestFn(config);
    // Should still attach the old token when proactive refresh fails
    expect(result.headers.Authorization).toBe("Bearer old-tok");
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

    const { default: apiClient } = await import("./client");

    const [, errorFn] = mockResponseUse.mock.calls[0];
    // Use separate error objects to avoid shared mutation of _retry flag
    const error1 = {
      response: { status: 401 },
      config: { _retry: false, headers: {} },
    } as unknown as AxiosError;
    const error2 = {
      response: { status: 401 },
      config: { _retry: false, headers: {} },
    } as unknown as AxiosError;

    const p1 = errorFn(error1);
    const p2 = errorFn(error2);

    resolveRefresh!("new-tok");

    await p1;
    await p2;

    // Verify apiClient was called with the retried requests carrying the new token
    const calls = vi.mocked(apiClient).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    // The retried configs should have the new token set
    const retried1 = calls[calls.length - 2][0] as unknown as {
      headers: { Authorization?: string };
    };
    const retried2 = calls[calls.length - 1][0] as unknown as {
      headers: { Authorization?: string };
    };
    expect(retried1.headers.Authorization).toBe("Bearer new-tok");
    expect(retried2.headers.Authorization).toBe("Bearer new-tok");
  });

  it("rejects queued request when refresh fails", async () => {
    const { refreshSession } = await import("./auth");
    vi.mocked(refreshSession).mockRejectedValue(new Error("refresh failed"));

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
    const error1 = {
      response: { status: 401 },
      config: { _retry: false, headers: {} },
    } as unknown as AxiosError;
    const error2 = {
      response: { status: 401 },
      config: { _retry: false, headers: {} },
    } as unknown as AxiosError;

    const p1 = errorFn(error1);
    const p2 = errorFn(error2);

    await expect(p1).rejects.toThrow("refresh failed");
    await expect(p2).rejects.toThrow("refresh failed");
    expect(mockLogout).toHaveBeenCalled();
  });

  it("passes through non-401 errors without refresh", async () => {
    await import("./client");

    const [, errorFn] = mockResponseUse.mock.calls[0];
    const error = {
      response: { status: 500 },
      config: { headers: {} },
    } as unknown as AxiosError;

    await expect(errorFn(error)).rejects.toEqual(error);
  });

  it("handles empty token from refresh by falling back to queued reject", async () => {
    const { refreshSession } = await import("./auth");
    vi.mocked(refreshSession).mockResolvedValue("");

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
    const error = {
      response: { status: 401 },
      config: { _retry: false, headers: {} },
    } as unknown as AxiosError;

    await expect(errorFn(error)).rejects.toThrow(
      "Session refresh returned empty token",
    );
    expect(mockLogout).toHaveBeenCalled();
  });

  it("passes successful responses through", async () => {
    await import("./client");

    const [successFn] = mockResponseUse.mock.calls[0];
    const response = { data: { ok: true }, status: 200 };
    expect(successFn(response)).toBe(response);
  });

  it("retries request with new token after successful refresh", async () => {
    const { refreshSession } = await import("./auth");
    vi.mocked(refreshSession).mockResolvedValue("new-tok");

    const { default: apiClient } = await import("./client");

    const [, errorFn] = mockResponseUse.mock.calls[0];
    const error = {
      response: { status: 401 },
      config: { _retry: false, headers: {} },
    } as unknown as AxiosError;

    vi.mocked(apiClient).mockResolvedValueOnce({ data: { ok: true } });

    const result = await errorFn(error);
    expect(result.data.ok).toBe(true);
  });

  it("skips refresh when request already has _retry flag", async () => {
    // Ensure the interceptor is set up
    await import("./client");

    // Get the registered error handler (second callback)
    const [, errorFn] = mockResponseUse.mock.calls[0];

    const error = {
      response: { status: 401 },
      config: { _retry: true, headers: {} },
    } as unknown as AxiosError;

    // The interceptor should immediately reject (no refresh)
    await expect(errorFn(error)).rejects.toEqual(error);

    // Confirm refresh was never attempted
    const { refreshSession } = await import("./auth");
    expect(refreshSession).not.toHaveBeenCalled();
  });
});
