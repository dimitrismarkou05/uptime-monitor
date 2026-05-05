import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMonitorPings, getMonitorStats } from "./pings";
import apiClient from "./client";

vi.mock("./client");

describe("pings API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("getMonitorPings requests with skip and limit", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { items: [{ id: "1" }], total: 1 },
    });
    const result = await getMonitorPings("mon-1", 0, 10);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/pings/monitor/mon-1?skip=0&limit=10",
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("getMonitorPings requests with custom skip and limit", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { items: [], total: 0 },
    });
    await getMonitorPings("mon-1", 20, 10);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/pings/monitor/mon-1?skip=20&limit=10",
    );
  });

  it("getMonitorStats requests stats endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { total_checks: 5 } });
    await getMonitorStats("mon-1");
    expect(apiClient.get).toHaveBeenCalledWith("/pings/monitor/mon-1/stats");
  });
});
