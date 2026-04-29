import { useQuery } from "@tanstack/react-query";
import { getMonitorPings, getMonitorStats } from "../api/pings";

export function useMonitorPings(monitorId: string, limit = 100) {
  return useQuery({
    queryKey: ["pings", monitorId, limit],
    queryFn: () => getMonitorPings(monitorId, limit),
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
