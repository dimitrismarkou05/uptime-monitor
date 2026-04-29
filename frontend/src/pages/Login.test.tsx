/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");

type AuthHook = ReturnType<typeof useAuth>;

describe("Login", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockAuth = (overrides: Partial<AuthHook> = {}): AuthHook => ({
    user: null,
    isAuthenticated: false,
    hasHydrated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    isLoggingIn: false,
    isRegistering: false,
    ...overrides,
  });

  it("renders sign in form", () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth());
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("toggles to sign up", () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth());
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
  });

  it("submits login credentials", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue(mockAuth({ login }));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(["a@b.com", "pass"]);
    });
  });
});
