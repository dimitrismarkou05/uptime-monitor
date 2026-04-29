import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMonitorPings, useMonitorStats } from "./usePings";
import * as pingsApi from "../api/pings";
import type { ReactNode } from "react";

vi.mock("../api/pings");

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
};

describe("usePings", () => {
  it("fetches pings for monitor", async () => {
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
    ]);

    const { result } = renderHook(() => useMonitorPings("m1", 50), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(pingsApi.getMonitorPings).toHaveBeenCalledWith("m1", 50);
  });

  it("fetches stats for monitor", async () => {
    vi.mocked(pingsApi.getMonitorStats).mockResolvedValue({
      total_checks: 10,
      uptime_count: 9,
      uptime_percent: 90,
      avg_response_ms: 120,
      last_24h: { checks: 10, uptime_percent: 90 },
    });

    const { result } = renderHook(() => useMonitorStats("m1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total_checks).toBe(10);
  });
});
