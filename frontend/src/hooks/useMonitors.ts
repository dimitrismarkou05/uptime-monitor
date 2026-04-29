import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMonitors,
  getMonitor,
  createMonitor,
  updateMonitor,
  deleteMonitor,
} from "../api/monitors";
import type { MonitorUpdate } from "../types/monitor";

const MONITORS_KEY = "monitors";

export function useMonitors() {
  return useQuery({
    queryKey: [MONITORS_KEY],
    queryFn: getMonitors,
  });
}

export function useMonitor(id: string) {
  return useQuery({
    queryKey: [MONITORS_KEY, id],
    queryFn: () => getMonitor(id),
    enabled: !!id,
  });
}

export function useCreateMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMonitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MONITORS_KEY] });
    },
  });
}

export function useUpdateMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MonitorUpdate }) =>
      updateMonitor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MONITORS_KEY] });
      queryClient.invalidateQueries({ queryKey: [MONITORS_KEY, variables.id] });
    },
  });
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMonitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MONITORS_KEY] });
    },
  });
}
