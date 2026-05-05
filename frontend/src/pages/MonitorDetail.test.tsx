/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MonitorDetail from "./MonitorDetail";
import { useMonitor } from "../hooks/useMonitors";
import { useMonitorStats, useMonitorPings } from "../hooks/usePings";
import type { ReactNode } from "react";
import { StatCard } from "./MonitorDetail";

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

interface MockPing {
  id: string;
  monitor_id: string;
  timestamp: string;
  status_code: number | null;
  response_ms: number | null;
  is_up: boolean;
  error_message: string | null;
}

const mockMonitor = {
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

const mockPing = (id: string, timestamp: string): MockPing => ({
  id,
  monitor_id: "1",
  timestamp,
  status_code: 200,
  response_ms: 100,
  is_up: true,
  error_message: null,
});

describe("MonitorDetail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const setup = (
    pingsItems: MockPing[] = [mockPing("p1", new Date().toISOString())],
    pingsTotal = pingsItems.length,
  ) => {
    vi.mocked(useMonitor).mockReturnValue({
      data: mockMonitor,
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
      data: { items: pingsItems, total: pingsTotal },
      isLoading: false,
    } as unknown as PingsHook);
  };

  it("renders monitor stats", () => {
    setup();
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
      data: { items: [], total: 0 },
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
      data: { items: [], total: 0 },
      isLoading: false,
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders back button", () => {
    setup([]);
    render(<MonitorDetail />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("renders without pings", () => {
    setup([], 0);
    render(<MonitorDetail />, { wrapper: Wrapper });

    expect(screen.getByText("https://example.com")).toBeInTheDocument();
    expect(screen.getByText("Recent Checks")).toBeInTheDocument();
    expect(screen.getByText(/no check data available/i)).toBeInTheDocument();
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
    expect(screen.getByText(/Monitor not found/i)).toBeInTheDocument();
  });

  it("renders ping with error message", () => {
    setup(
      [
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
      1,
    );

    render(<MonitorDetail />, { wrapper: Wrapper });
    expect(screen.getByText("Connection timeout")).toBeInTheDocument();
    expect(screen.queryByText(/HTTP/)).not.toBeInTheDocument();
  });

  it("StatCard renders label and value", () => {
    render(<StatCard label="Test" value="123" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("navigates to dashboard when 'Back to Dashboard' is clicked (Not Found state)", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as MonitorHook);
    vi.mocked(useMonitorStats).mockReturnValue({
      data: null,
    } as unknown as StatsHook);
    vi.mocked(useMonitorPings).mockReturnValue({
      data: { items: [], total: 0 },
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });
    const backBtn = screen.getByRole("button", { name: /back to dashboard/i });
    fireEvent.click(backBtn);
  });

  it("navigates to dashboard when '← Back' is clicked (Found state)", () => {
    setup([]);
    render(<MonitorDetail />, { wrapper: Wrapper });
    const backBtn = screen.getByRole("button", { name: /← back/i });
    fireEvent.click(backBtn);
  });

  it("renders pagination controls when there are pings", () => {
    setup(
      Array.from({ length: 10 }).map((_, i) =>
        mockPing(`p${i}`, new Date().toISOString()),
      ),
      25,
    );

    render(<MonitorDetail />, { wrapper: Wrapper });

    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/25 total checks/i)).toBeInTheDocument();
  });

  it("disables previous button on first page", () => {
    setup([mockPing("p1", new Date().toISOString())], 1);
    render(<MonitorDetail />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("disables next button on last page", () => {
    setup([mockPing("p1", new Date().toISOString())], 1);
    render(<MonitorDetail />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("clicks next page and updates page number", () => {
    setup(
      Array.from({ length: 10 }).map((_, i) =>
        mockPing(`p${i}`, new Date().toISOString()),
      ),
      25,
    );

    render(<MonitorDetail />, { wrapper: Wrapper });

    const nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // After clicking next, useMonitorPings should be called with skip=10
    expect(useMonitorPings).toHaveBeenCalledWith("1", 10, 10);
  });

  it("clicks previous page after navigating forward", () => {
    // Start on page 1 (skip=10)
    vi.mocked(useMonitorPings).mockImplementation(
      (_monitorId: string, skip?: number) => {
        return {
          data: {
            items: Array.from({ length: 10 }).map((_, i) =>
              mockPing(`p${(skip ?? 0) + i}`, new Date().toISOString()),
            ),
            total: 25,
          },
          isLoading: false,
        } as unknown as PingsHook;
      },
    );

    vi.mocked(useMonitor).mockReturnValue({
      data: mockMonitor,
      isLoading: false,
    } as unknown as MonitorHook);
    vi.mocked(useMonitorStats).mockReturnValue({
      data: {
        total_checks: 25,
        uptime_count: 25,
        uptime_percent: 100,
        avg_response_ms: 100,
        last_24h: { checks: 25, uptime_percent: 100 },
      },
      isLoading: false,
    } as unknown as StatsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });

    // Navigate to page 2 first
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Then click previous
    const prevBtn = screen.getByRole("button", { name: /previous/i });
    fireEvent.click(prevBtn);

    // Should go back to page 0
    expect(useMonitorPings).toHaveBeenCalledWith("1", 0, 10);
  });

  it("shows loading spinner for pings section", () => {
    vi.mocked(useMonitor).mockReturnValue({
      data: mockMonitor,
      isLoading: false,
    } as unknown as MonitorHook);
    vi.mocked(useMonitorStats).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as StatsHook);
    vi.mocked(useMonitorPings).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as PingsHook);

    render(<MonitorDetail />, { wrapper: Wrapper });

    // Should show spinner in the pings section
    const spinners = document.querySelectorAll(".animate-spin");
    expect(spinners.length).toBeGreaterThan(0);
  });

  it("formats timestamp with seconds", () => {
    const timestamp = "2024-05-05T05:28:37Z";
    setup([mockPing("p1", timestamp)], 1);

    render(<MonitorDetail />, { wrapper: Wrapper });

    // The formatted date should include seconds (37)
    expect(screen.getByText(/37/)).toBeInTheDocument();
  });

  it("renders multiple ping rows", () => {
    const pings: MockPing[] = [
      mockPing("p1", "2024-05-05T05:28:10Z"),
      mockPing("p2", "2024-05-05T05:28:20Z"),
      mockPing("p3", "2024-05-05T05:28:30Z"),
    ];
    setup(pings, 3);

    render(<MonitorDetail />, { wrapper: Wrapper });

    expect(screen.getByText("HTTP 200")).toBeInTheDocument();
    expect(screen.getByText("100ms")).toBeInTheDocument();
  });
});
