import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
    });
  });

  it("initializes unauthenticated", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.hasHydrated).toBe(false);
  });

  it("setUser authenticates", () => {
    useAuthStore.getState().setUser({ id: "1", email: "a@b.com" });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe("a@b.com");
  });

  it("logout clears state and token", () => {
    localStorage.setItem("access_token", "tok");
    useAuthStore.getState().setUser({ id: "1", email: "a@b.com" });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("setHasHydrated updates flag", () => {
    useAuthStore.getState().setHasHydrated(true);
    expect(useAuthStore.getState().hasHydrated).toBe(true);
  });
});
