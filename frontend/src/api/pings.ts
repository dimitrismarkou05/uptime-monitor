import apiClient from "./client";
import type { PingLogRead, PingStats } from "../types/ping";

export interface PingListResponse {
  items: PingLogRead[];
  total: number;
}

export async function getMonitorPings(
  monitorId: string,
  skip: number = 0,
  limit: number = 10,
): Promise<PingListResponse> {
  const { data } = await apiClient.get(
    `/pings/monitor/${monitorId}?skip=${skip}&limit=${limit}`,
  );
  return data;
}

export async function getMonitorStats(monitorId: string): Promise<PingStats> {
  const { data } = await apiClient.get(`/pings/monitor/${monitorId}/stats`);
  return data;
}
