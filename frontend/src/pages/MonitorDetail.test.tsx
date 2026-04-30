/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MonitorDetail from "./MonitorDetail";
import { useMonitor } from "../hooks/useMonitors";
import { useMonitorStats, useMonitorPings } from "../hooks/usePings";
import type { ReactNode } from "react";

vi.mock("../hooks/useMonitors");
vi.mock("../hooks/usePings");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={["/monitor/1"]}>
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Routes>
        <Route path="/monitor/:id" element={children} />
      </Routes>
    </QueryClientProvider>
  </MemoryRouter>
);

type MonitorHook = ReturnType<typeof useMonitor>;
type StatsHook = ReturnType<typeof useMonitorStats>;
type PingsHook = ReturnType<typeof useMonitorPings>;

describe("MonitorDetail", () => {
  it("renders monitor stats", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: {
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
      },
      isLoading: false,
    } as unknown as MonitorHook);

    vi.mocked(useMonitorStats).mockReturnValue({
      data: {
        total_checks: 10,
        uptime_count: 9,
        uptime_percent: 90,
        avg_response_ms: 120,
        last_24h: { checks: 10, uptime_percent: 90 },
      },
      isLoading: false,
    } as unknown as StatsHook);

    vi.mocked(useMonitorPings).mockReturnValue({
      data: [
        {
          id: "p1",
          monitor_id: "1",
          timestamp: new Date().toISOString(),
          status_code: 200,
          response_ms: 100,
          is_up: true,
          error_message: null,
        },
      ],
      isLoading: false,
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });

    expect(screen.getByText("https://example.com")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("120ms")).toBeInTheDocument();
  });

  it("shows not found", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as MonitorHook);

    vi.mocked(useMonitorStats).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as StatsHook);

    vi.mocked(useMonitorPings).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });
    expect(screen.getByText(/monitor not found/i)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: null,
      isLoading: true,
    } as unknown as MonitorHook);
    vi.mocked(useMonitorStats).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as StatsHook);
    vi.mocked(useMonitorPings).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders back button", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: {
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
      },
      isLoading: false,
    } as unknown as MonitorHook);
    vi.mocked(useMonitorStats).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as StatsHook);
    vi.mocked(useMonitorPings).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("renders without pings", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: {
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
      },
      isLoading: false,
    } as unknown as MonitorHook);

    vi.mocked(useMonitorStats).mockReturnValue({
      data: {
        total_checks: 0,
        uptime_count: 0,
        uptime_percent: 0,
        avg_response_ms: null,
        last_24h: { checks: 0, uptime_percent: 0 },
      },
      isLoading: false,
    } as unknown as StatsHook);

    vi.mocked(useMonitorPings).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });

    expect(screen.getByText("https://example.com")).toBeInTheDocument();
    expect(screen.getByText("Recent Checks")).toBeInTheDocument();
    // The pings list should render empty (no ping rows)
    expect(screen.queryByText("HTTP 200")).not.toBeInTheDocument();
  });

  it("shows error state when monitor is not found", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: null,
      error: new Error("404"),
      isLoading: false,
      isError: true,
      status: "error",
    } as unknown as ReturnType<typeof useMonitor>);

    render(<MonitorDetail />, { wrapper: Wrapper });

    // Matches the text in test log
    expect(screen.getByText(/Monitor not found/i)).toBeInTheDocument();
  });

  it("renders ping with error message", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: {
        id: "1",
        user_id: "u1",
        url: "https://example.com",
        interval_seconds: 300,
        is_active: true,
        alert_status: "DOWN",
        last_alerted_at: null,
        next_check_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      isLoading: false,
    } as unknown as MonitorHook);

    vi.mocked(useMonitorStats).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as StatsHook);

    vi.mocked(useMonitorPings).mockReturnValue({
      data: [
        {
          id: "p1",
          monitor_id: "1",
          timestamp: new Date().toISOString(),
          status_code: null,
          response_ms: null,
          is_up: false,
          error_message: "Connection timeout",
        },
      ],
      isLoading: false,
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });

    expect(screen.getByText("Connection timeout")).toBeInTheDocument();
    expect(screen.queryByText(/HTTP/)).not.toBeInTheDocument();
  });
});
