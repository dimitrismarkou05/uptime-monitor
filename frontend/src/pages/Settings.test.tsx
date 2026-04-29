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
    vi.mocked(authApi.updateEmail).mockResolvedValue(
      {} as Awaited<ReturnType<typeof authApi.updateEmail>>,
    );

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
    vi.mocked(authApi.updatePassword).mockResolvedValue(
      {} as Awaited<ReturnType<typeof authApi.updatePassword>>,
    );

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
});
