/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EditMonitorModal from "./EditMonitorModal";
import type { MonitorRead } from "../../types/monitor";

const mockMonitor: MonitorRead = {
  id: "1",
  user_id: "u1",
  url: "https://example.com",
  interval_seconds: 300,
  is_active: true,
  alert_status: "UP",
  last_alerted_at: null,
  next_check_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("EditMonitorModal", () => {
  it("renders form with initial data", () => {
    render(
      <EditMonitorModal
        monitor={mockMonitor}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /edit monitor/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://example.com")).toBeInTheDocument();
  });

  it("calls onSave with updated data", () => {
    const onSave = vi.fn();
    render(
      <EditMonitorModal
        monitor={mockMonitor}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("https://example.com"), {
      target: { value: "https://new.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    expect(onSave).toHaveBeenCalledWith("1", {
      url: "https://new.com",
      interval_seconds: 300,
      is_active: true,
    });
  });

  it("calls onClose when cancel clicked", () => {
    const onClose = vi.fn();
    render(
      <EditMonitorModal
        monitor={mockMonitor}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
