import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMonitorPings, getMonitorStats } from "./pings";
import apiClient from "./client";

vi.mock("./client");

describe("pings API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("getMonitorPings requests with limit", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ id: "1" }] });
    await getMonitorPings("mon-1", 50);
    expect(apiClient.get).toHaveBeenCalledWith("/pings/monitor/mon-1?limit=50");
  });

  it("getMonitorStats requests stats endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { total_checks: 5 } });
    await getMonitorStats("mon-1");
    expect(apiClient.get).toHaveBeenCalledWith("/pings/monitor/mon-1/stats");
  });
});
