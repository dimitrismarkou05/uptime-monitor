import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signIn,
  signUp,
  signOut,
  updateEmail,
  updatePassword,
  requestPasswordReset,
  getToken,
  getRefreshToken,
  isTokenExpiringSoon,
  refreshSession,
} from "./auth";

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();
const mockResetPassword = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPassword(...args),
      refreshSession: (...args: unknown[]) => mockRefreshSession(...args),
    },
  })),
}));

describe("auth API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("signIn stores token and refresh token", async () => {
    mockSignIn.mockResolvedValue({
      data: {
        session: {
          access_token: "tok",
          refresh_token: "refresh",
          expires_in: 3600,
        },
        user: { id: "1" },
      },
      error: null,
    });
    const user = await signIn("a@b.com", "pass");
    expect(user).toEqual({ id: "1" });
    expect(localStorage.getItem("access_token")).toBe("tok");
    expect(localStorage.getItem("refresh_token")).toBe("refresh");
    expect(localStorage.getItem("token_expires_at")).toBeTruthy();
  });

  it("signIn throws on error", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error("bad creds"),
    });
    await expect(signIn("a@b.com", "pass")).rejects.toThrow("bad creds");
  });

  it("signUp returns user and stores session", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "1" },
        session: {
          access_token: "tok",
          refresh_token: "refresh",
          expires_in: 3600,
        },
      },
      error: null,
    });
    const user = await signUp("a@b.com", "pass");
    expect(user).toEqual({ id: "1" });
    expect(getRefreshToken()).toBe("refresh");
  });

  it("signUp returns user without session", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "1" },
        session: null,
      },
      error: null,
    });
    const user = await signUp("a@b.com", "pass");
    expect(user).toEqual({ id: "1" });
    expect(getRefreshToken()).toBeNull();
  });
  it("signUp throws on error", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("exists"),
    });
    await expect(signUp("a@b.com", "pass")).rejects.toThrow("exists");
  });

  it("signOut clears all tokens", async () => {
    localStorage.setItem("access_token", "tok");
    localStorage.setItem("refresh_token", "ref");
    localStorage.setItem("token_expires_at", "1234567890");
    mockSignOut.mockResolvedValue({ error: null });
    await signOut();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(localStorage.getItem("token_expires_at")).toBeNull();
  });

  it("updateEmail delegates to supabase", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: { email: "new@b.com" } },
      error: null,
    });
    const result = await updateEmail("new@b.com");
    expect(result.user?.email).toBe("new@b.com");
  });

  it("updateEmail throws on error", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: new Error("email fail"),
    });
    await expect(updateEmail("a@b.com")).rejects.toThrow("email fail");
  });

  it("updatePassword delegates to supabase", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: {} },
      error: null,
    });
    await updatePassword("newpass");
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpass" });
  });

  it("updatePassword throws on error", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: new Error("password fail"),
    });
    await expect(updatePassword("pass")).rejects.toThrow("password fail");
  });

  it("requestPasswordReset delegates with redirect", async () => {
    mockResetPassword.mockResolvedValue({ data: {}, error: null });
    await requestPasswordReset("a@b.com");
    expect(mockResetPassword).toHaveBeenCalledWith("a@b.com", {
      redirectTo: expect.stringContaining("/settings"),
    });
  });

  it("requestPasswordReset throws on error", async () => {
    mockResetPassword.mockResolvedValue({
      data: null,
      error: new Error("reset fail"),
    });
    await expect(requestPasswordReset("a@b.com")).rejects.toThrow("reset fail");
  });

  it("getToken reads from localStorage", () => {
    localStorage.setItem("access_token", "tok");
    expect(getToken()).toBe("tok");
  });

  it("getToken returns null when no token", () => {
    expect(getToken()).toBeNull();
  });

  it("getRefreshToken reads from localStorage", () => {
    localStorage.setItem("refresh_token", "ref");
    expect(getRefreshToken()).toBe("ref");
  });

  it("isTokenExpiringSoon returns false when no expiry", () => {
    expect(isTokenExpiringSoon()).toBe(false);
  });

  it("isTokenExpiringSoon returns true when token is expired", () => {
    localStorage.setItem("token_expires_at", String(Date.now() - 1000));
    expect(isTokenExpiringSoon()).toBe(true);
  });

  it("isTokenExpiringSoon returns true when within buffer", () => {
    localStorage.setItem(
      "token_expires_at",
      String(Date.now() + 2 * 60 * 1000),
    ); // 2 min left
    expect(isTokenExpiringSoon()).toBe(true);
  });

  it("refreshSession updates tokens on success", async () => {
    localStorage.setItem("refresh_token", "old-refresh");
    mockRefreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: "new-tok",
          refresh_token: "new-refresh",
          expires_in: 3600,
        },
      },
      error: null,
    });

    const token = await refreshSession();
    expect(token).toBe("new-tok");
    expect(localStorage.getItem("access_token")).toBe("new-tok");
    expect(localStorage.getItem("refresh_token")).toBe("new-refresh");
  });

  it("refreshSession clears session and throws on failure", async () => {
    localStorage.setItem("refresh_token", "old-refresh");
    localStorage.setItem("access_token", "old-tok");
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid refresh token" },
    });

    await expect(refreshSession()).rejects.toThrow("Invalid refresh token");
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("refreshSession throws when no refresh token exists", async () => {
    await expect(refreshSession()).rejects.toThrow(
      "No refresh token available",
    );
  });

  it("isTokenExpiringSoon returns false when token is not near expiry", () => {
    localStorage.setItem(
      "token_expires_at",
      String(Date.now() + 10 * 60 * 1000),
    ); // 10 min left, buffer is 5 min
    expect(isTokenExpiringSoon()).toBe(false);
  });

  it("refreshSession throws default message when error has empty message", async () => {
    localStorage.setItem("refresh_token", "old-refresh");
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: "" }, // Empty string triggers fallback
    });

    await expect(refreshSession()).rejects.toThrow("Session refresh failed");
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});
