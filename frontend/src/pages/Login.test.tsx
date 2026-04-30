/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Login from "./Login";

// Mock auth.ts BEFORE any import resolves it (eager Supabase client creation)
vi.mock("../api/auth", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  getToken: vi.fn(),
}));

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

  it("redirects if already authenticated", async () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth({ isAuthenticated: true }));

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });
  });

  it("handles string errors during login", async () => {
    const login = vi.fn().mockRejectedValue("Custom string error");
    vi.mocked(useAuth).mockReturnValue(mockAuth({ login }));

    render(<Login />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Custom string error")).toBeInTheDocument();
    });
  });

  it("submits sign up credentials", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue(mockAuth({ register }));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "new@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(["new@b.com", "pass123"]);
    });
  });

  it("shows loading spinner during login", () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth({ isLoggingIn: true }));
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it("shows loading state during registration", () => {
    vi.mocked(useAuth).mockReturnValue(mockAuth({ isRegistering: true }));
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });
});
