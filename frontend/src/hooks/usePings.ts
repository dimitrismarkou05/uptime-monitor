import { useQuery } from "@tanstack/react-query";
import { getMonitorPings, getMonitorStats } from "../api/pings";

export function useMonitorPings(
  monitorId: string,
  skip: number = 0,
  limit: number = 10,
) {
  return useQuery({
    queryKey: ["pings", monitorId, skip, limit],
    queryFn: () => getMonitorPings(monitorId, skip, limit),
    enabled: !!monitorId,
  });
}

export function useMonitorStats(monitorId: string) {
  return useQuery({
    queryKey: ["ping-stats", monitorId],
    queryFn: () => getMonitorStats(monitorId),
    enabled: !!monitorId,
    refetchInterval: 60000, // Refresh every minute
  });
}
