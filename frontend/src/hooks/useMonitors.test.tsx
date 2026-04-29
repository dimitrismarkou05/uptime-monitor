import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMonitors, useMonitor } from "./useMonitors";
import * as monitorsApi from "../api/monitors";
import type { ReactNode } from "react";

vi.mock("../api/monitors");

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

const mockMonitor = {
  id: "1",
  user_id: "u1",
  url: "https://x.com",
  interval_seconds: 300,
  is_active: true,
  alert_status: "UP" as const,
  last_alerted_at: null,
  next_check_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("useMonitors", () => {
  it("returns monitor list", async () => {
    vi.mocked(monitorsApi.getMonitors).mockResolvedValue([mockMonitor]);
    const { result } = renderHook(() => useMonitors(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockMonitor]);
  });

  it("fetches single monitor", async () => {
    vi.mocked(monitorsApi.getMonitor).mockResolvedValue(mockMonitor);
    const { result } = renderHook(() => useMonitor("1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMonitor);
  });
});
