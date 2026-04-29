import apiClient from "./client";
import type { PingLogRead, PingStats } from "../types/ping";

export async function getMonitorPings(
  monitorId: string,
  limit = 100,
): Promise<PingLogRead[]> {
  const { data } = await apiClient.get(
    `/pings/monitor/${monitorId}?limit=${limit}`,
  );
  return data;
}

export async function getMonitorStats(monitorId: string): Promise<PingStats> {
  const { data } = await apiClient.get(`/pings/monitor/${monitorId}/stats`);
  return data;
}
