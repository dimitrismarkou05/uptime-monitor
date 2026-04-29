/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardShell from "./DashboardShell";

describe("DashboardShell", () => {
  it("renders navbar and children", () => {
    render(
      <MemoryRouter>
        <DashboardShell>
          <div data-testid="child">content</div>
        </DashboardShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("Uptime Monitor")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
