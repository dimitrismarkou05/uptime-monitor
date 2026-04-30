/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import type { ReactNode } from "react";

vi.mock("./components/auth/ProtectedRoute", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("./pages/Login", () => ({
  default: () => <div>login page</div>,
}));
vi.mock("./pages/Dashboard", () => ({
  default: () => <div>dashboard page</div>,
}));
vi.mock("./pages/MonitorDetail", () => ({
  default: () => <div>detail page</div>,
}));
vi.mock("./pages/Settings", () => ({
  default: () => <div>settings page</div>,
}));

describe("App", () => {
  it("renders login route", () => {
    window.history.pushState({}, "", "/login");
    render(<App />);
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("redirects root to dashboard", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText("dashboard page")).toBeInTheDocument();
  });

  it("renders dashboard route", () => {
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    expect(screen.getByText("dashboard page")).toBeInTheDocument();
  });

  it("renders monitor detail route", () => {
    window.history.pushState({}, "", "/monitor/123");
    render(<App />);
    expect(screen.getByText("detail page")).toBeInTheDocument();
  });

  it("renders settings route", () => {
    window.history.pushState({}, "", "/settings");
    render(<App />);
    expect(screen.getByText("settings page")).toBeInTheDocument();
  });
});
