import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useMonitors,
  useMonitor,
  useCreateMonitor,
  useUpdateMonitor,
  useDeleteMonitor,
} from "./useMonitors";
import type { MonitorCreate } from "../types/monitor";
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

const mockListResponse = {
  items: [mockMonitor],
  total: 1,
};

describe("useMonitors", () => {
  it("returns monitor list with items and total", async () => {
    vi.mocked(monitorsApi.getMonitors).mockResolvedValue(mockListResponse);
    const { result } = renderHook(() => useMonitors(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toEqual([mockMonitor]);
    expect(result.current.data?.total).toBe(1);
  });

  it("fetches single monitor", async () => {
    vi.mocked(monitorsApi.getMonitor).mockResolvedValue(mockMonitor);
    const { result } = renderHook(() => useMonitor("1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMonitor);
  });

  describe("mutations", () => {
    it("creates monitor and invalidates list", async () => {
      vi.mocked(monitorsApi.createMonitor).mockResolvedValue(mockMonitor);
      const { result } = renderHook(() => useCreateMonitor(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          url: "https://new.com",
          interval_seconds: 300,
          is_active: true,
        } as MonitorCreate);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("updates monitor and invalidates queries", async () => {
      vi.mocked(monitorsApi.updateMonitor).mockResolvedValue(mockMonitor);
      const { result } = renderHook(() => useUpdateMonitor(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: "1",
          data: { interval_seconds: 600 },
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("deletes monitor and invalidates list", async () => {
      vi.mocked(monitorsApi.deleteMonitor).mockResolvedValue(undefined);
      const { result } = renderHook(() => useDeleteMonitor(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync("1");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
