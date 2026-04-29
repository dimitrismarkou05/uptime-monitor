/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UptimeChart from "./UptimeChart";
import * as pingsApi from "../../api/pings";
import type { ReactNode } from "react";

vi.mock("../../api/pings");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

describe("UptimeChart", () => {
  it("shows loading state", () => {
    vi.mocked(pingsApi.getMonitorPings).mockReturnValue(new Promise(() => {}));
    render(<UptimeChart monitorId="m1" />, { wrapper: Wrapper });
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    vi.mocked(pingsApi.getMonitorPings).mockResolvedValue([]);
    render(<UptimeChart monitorId="m1" />, { wrapper: Wrapper });
    await screen.findByText(/no ping data available/i);
  });

  it("renders bars for pings", async () => {
    vi.mocked(pingsApi.getMonitorPings).mockResolvedValue([
      {
        id: "p1",
        monitor_id: "m1",
        timestamp: new Date().toISOString(),
        status_code: 200,
        response_ms: 100,
        is_up: true,
        error_message: null,
      },
      {
        id: "p2",
        monitor_id: "m1",
        timestamp: new Date().toISOString(),
        status_code: 500,
        response_ms: null,
        is_up: false,
        error_message: "err",
      },
    ]);
    render(<UptimeChart monitorId="m1" />, { wrapper: Wrapper });
    await screen.findByText(/2 checks/i);
    expect(screen.getByText(/1 passed/i)).toBeInTheDocument();
  });
});
