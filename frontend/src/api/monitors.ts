import apiClient from "./client";
import type {
  MonitorCreate,
  MonitorRead,
  MonitorUpdate,
  MonitorListResponse,
} from "../types/monitor";

export async function getMonitors(
  skip: number = 0,
  limit: number = 100,
): Promise<MonitorListResponse> {
  const { data } = await apiClient.get(
    `/monitors/?skip=${skip}&limit=${limit}`,
  );
  return data;
}

export async function getMonitor(id: string): Promise<MonitorRead> {
  const { data } = await apiClient.get(`/monitors/${id}`);
  return data;
}

export async function createMonitor(
  monitor: MonitorCreate,
): Promise<MonitorRead> {
  const { data } = await apiClient.post("/monitors/", monitor);
  return data;
}

export async function updateMonitor(
  id: string,
  monitor: MonitorUpdate,
): Promise<MonitorRead> {
  const { data } = await apiClient.patch(`/monitors/${id}`, monitor);
  return data;
}

export async function deleteMonitor(id: string): Promise<void> {
  await apiClient.delete(`/monitors/${id}`);
}
