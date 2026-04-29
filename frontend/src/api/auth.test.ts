import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signIn,
  signUp,
  signOut,
  updateEmail,
  updatePassword,
  requestPasswordReset,
  getToken,
} from "./auth";

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();
const mockResetPassword = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPassword(...args),
    },
  })),
}));

describe("auth API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("signIn stores token and returns user", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: { access_token: "tok" }, user: { id: "1" } },
      error: null,
    });
    const user = await signIn("a@b.com", "pass");
    expect(user).toEqual({ id: "1" });
    expect(localStorage.getItem("access_token")).toBe("tok");
  });

  it("signIn throws on error", async () => {
    mockSignIn.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error("bad creds"),
    });
    await expect(signIn("a@b.com", "pass")).rejects.toThrow("bad creds");
  });

  it("signUp returns user", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    });
    const user = await signUp("a@b.com", "pass");
    expect(user).toEqual({ id: "1" });
  });

  it("signUp throws on error", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: new Error("exists"),
    });
    await expect(signUp("a@b.com", "pass")).rejects.toThrow("exists");
  });

  it("signOut clears token", async () => {
    localStorage.setItem("access_token", "tok");
    mockSignOut.mockResolvedValue({ error: null });
    await signOut();
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("updateEmail delegates to supabase", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: { email: "new@b.com" } },
      error: null,
    });
    const result = await updateEmail("new@b.com");
    expect(result.user?.email).toBe("new@b.com");
  });

  it("updatePassword delegates to supabase", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: {} },
      error: null,
    });
    await updatePassword("newpass");
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpass" });
  });

  it("requestPasswordReset delegates with redirect", async () => {
    mockResetPassword.mockResolvedValue({ data: {}, error: null });
    await requestPasswordReset("a@b.com");
    expect(mockResetPassword).toHaveBeenCalledWith("a@b.com", {
      redirectTo: expect.stringContaining("/settings"),
    });
  });

  it("getToken reads from localStorage", () => {
    localStorage.setItem("access_token", "tok");
    expect(getToken()).toBe("tok");
  });
});
