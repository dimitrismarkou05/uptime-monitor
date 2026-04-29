/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuthStore } from "../../stores/authStore";

describe("Navbar", () => {
  it("renders user email", () => {
    useAuthStore.setState({
      user: { id: "1", email: "user@test.com" },
      isAuthenticated: true,
      hasHydrated: true,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("calls logout on button click", () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");

    useAuthStore.setState({
      user: { id: "1", email: "user@test.com" },
      isAuthenticated: true,
      hasHydrated: true,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(logoutSpy).toHaveBeenCalled();
    logoutSpy.mockRestore();
  });

  it("has link to settings", () => {
    useAuthStore.setState({
      user: { id: "1", email: "user@test.com" },
      isAuthenticated: true,
      hasHydrated: true,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});
