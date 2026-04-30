/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MonitorList from "./MonitorList";
import type { MonitorRead } from "../../types/monitor";

const mockMonitors: MonitorRead[] = [
  {
    id: "1",
    user_id: "u1",
    url: "https://up.com",
    interval_seconds: 300,
    is_active: true,
    alert_status: "UP",
    last_alerted_at: null,
    next_check_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "u1",
    url: "https://down.com",
    interval_seconds: 600,
    is_active: false,
    alert_status: "DOWN",
    last_alerted_at: null,
    next_check_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("MonitorList", () => {
  it("renders empty state", () => {
    render(
      <MemoryRouter>
        <MonitorList
          monitors={[]}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
          onEdit={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no monitors yet/i)).toBeInTheDocument();
  });

  it("renders monitor rows", () => {
    render(
      <MemoryRouter>
        <MonitorList
          monitors={mockMonitors}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
          onEdit={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("https://up.com")).toBeInTheDocument();
    expect(screen.getByText("https://down.com")).toBeInTheDocument();
  });

  it("calls onEdit when edit clicked", () => {
    const onEdit = vi.fn();
    render(
      <MemoryRouter>
        <MonitorList
          monitors={mockMonitors}
          onDelete={vi.fn()}
          onToggle={vi.fn()}
          onEdit={onEdit}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    expect(onEdit).toHaveBeenCalledWith(mockMonitors[0]);
  });

  it("calls onToggle when switch clicked", () => {
    const onToggle = vi.fn();
    render(
      <MemoryRouter>
        <MonitorList
          monitors={mockMonitors}
          onDelete={vi.fn()}
          onToggle={onToggle}
          onEdit={vi.fn()}
        />
      </MemoryRouter>,
    );
    // The toggle is the first rounded-full button in the Active column
    const toggleButton = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("rounded-full"));
    expect(toggleButton).toBeDefined();
    fireEvent.click(toggleButton!);
    expect(onToggle).toHaveBeenCalledWith("1", false);
  });

  it("calls onDelete when deletion is confirmed", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    window.confirm = vi.fn(() => true);

    render(
      <MemoryRouter>
        <MonitorList
          monitors={mockMonitors}
          onDelete={onDelete}
          onToggle={vi.fn()}
          onEdit={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("1"));
  });

  it("skips onDelete when deletion is cancelled", () => {
    const onDelete = vi.fn();
    window.confirm = vi.fn(() => false);

    render(
      <MemoryRouter>
        <MonitorList
          monitors={mockMonitors}
          onDelete={onDelete}
          onToggle={vi.fn()}
          onEdit={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    expect(onDelete).not.toHaveBeenCalled();
  });
});
