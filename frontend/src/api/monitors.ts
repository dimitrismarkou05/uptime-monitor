import apiClient from "./client";
import type { MonitorCreate, MonitorRead } from "../types/monitor";

export async function getMonitors(): Promise<MonitorRead[]> {
  const { data } = await apiClient.get("/monitors/");
  return data;
}

export async function createMonitor(
  monitor: MonitorCreate,
): Promise<MonitorRead> {
  const { data } = await apiClient.post("/monitors/", monitor);
  return data;
}

export async function deleteMonitor(id: string): Promise<void> {
  await apiClient.delete(`/monitors/${id}`);
}

export async function getMonitor(id: string): Promise<MonitorRead> {
  const { data } = await apiClient.get(`/monitors/${id}`);
  return data;
}
