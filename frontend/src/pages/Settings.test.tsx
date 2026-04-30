/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import Settings from "./Settings";

vi.mock("../api/auth", () => ({
  updateEmail: vi.fn(),
  updatePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

vi.mock("../api/users", () => ({
  deleteAccount: vi.fn(),
}));

import * as authApi from "../api/auth";
import * as usersApi from "../api/users";

describe("Settings", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: "1", email: "a@b.com" },
      isAuthenticated: true,
      hasHydrated: true,
    });
    vi.resetAllMocks();
  });

  it("renders settings page", () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("updates email", async () => {
    vi.mocked(authApi.updateEmail).mockResolvedValue({
      user: {
        id: "1",
        email: "new@b.com",
        created_at: new Date().toISOString(),
      },
    } as Awaited<ReturnType<typeof authApi.updateEmail>>);

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByDisplayValue("a@b.com"), {
      target: { value: "new@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update email/i }));

    await waitFor(() => {
      expect(authApi.updateEmail).toHaveBeenCalledWith("new@b.com");
    });
  });

  it("updates password", async () => {
    vi.mocked(authApi.updatePassword).mockResolvedValue({
      user: { id: "1", email: "a@b.com", created_at: new Date().toISOString() },
    } as Awaited<ReturnType<typeof authApi.updatePassword>>);

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "newpass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => {
      expect(authApi.updatePassword).toHaveBeenCalledWith("newpass123");
    });
  });

  it("deletes account after confirmation", async () => {
    vi.mocked(usersApi.deleteAccount).mockResolvedValue(undefined);
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    confirmSpy.mockRestore();

    await waitFor(() => {
      expect(usersApi.deleteAccount).toHaveBeenCalled();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  it("shows error when email update fails", async () => {
    vi.mocked(authApi.updateEmail).mockRejectedValue(
      new Error("Email already taken"),
    );

    render(<Settings />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByDisplayValue("a@b.com"), {
      target: { value: "new@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update email/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already taken")).toBeInTheDocument();
    });
  });

  it("shows error when password reset fails with string error", async () => {
    vi.mocked(authApi.requestPasswordReset).mockRejectedValue(
      "Too many requests",
    );

    render(<Settings />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText("Too many requests")).toBeInTheDocument();
    });
  });

  it("shows generic fallback error when non-standard error is thrown", async () => {
    vi.mocked(authApi.updatePassword).mockRejectedValue({ code: 500 });

    render(<Settings />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred"),
      ).toBeInTheDocument();
    });
  });

  it("handles error in delete account process", async () => {
    vi.mocked(usersApi.deleteAccount).mockRejectedValue(
      new Error("Delete failed"),
    );
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<Settings />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
    confirmSpy.mockRestore();
  });

  it("does not call updateEmail when unchanged", async () => {
    render(<Settings />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole("button", { name: /update email/i }));
    await waitFor(() => {
      expect(authApi.updateEmail).not.toHaveBeenCalled();
    });
  });

  it("does not call updatePassword when empty", async () => {
    render(<Settings />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));
    await waitFor(() => {
      expect(authApi.updatePassword).not.toHaveBeenCalled();
    });
  });

  it("sends password reset link", async () => {
    vi.mocked(authApi.requestPasswordReset).mockResolvedValue({});
    render(<Settings />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(authApi.requestPasswordReset).toHaveBeenCalledWith("a@b.com");
    });
  });

  it("cancels account deletion when not confirmed", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Settings />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    confirmSpy.mockRestore();
    await waitFor(() => {
      expect(usersApi.deleteAccount).not.toHaveBeenCalled();
    });
  });

  it("displays success message after email update", async () => {
    vi.mocked(authApi.updateEmail).mockResolvedValue({
      user: {
        id: "1",
        email: "new@b.com",
        created_at: new Date().toISOString(),
      },
    } as Awaited<ReturnType<typeof authApi.updateEmail>>);

    render(<Settings />, { wrapper: MemoryRouter });
    fireEvent.change(screen.getByDisplayValue("a@b.com"), {
      target: { value: "new@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update email/i }));

    await waitFor(() => {
      expect(screen.getByText(/verification link sent/i)).toBeInTheDocument();
    });
  });

  it("disables buttons while loading during email update", async () => {
    vi.mocked(authApi.updateEmail).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    render(<Settings />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByDisplayValue("a@b.com"), {
      target: { value: "new@b.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update email/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /update email/i }),
      ).toBeDisabled();
    });
  });

  it("disables buttons while loading during password update", async () => {
    vi.mocked(authApi.updatePassword).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<Settings />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "newpass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /set password/i }),
      ).toBeDisabled();
    });
  });

  it("disables reset link button while loading", async () => {
    vi.mocked(authApi.requestPasswordReset).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<Settings />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send reset link/i }),
      ).toBeDisabled();
    });
  });
});
