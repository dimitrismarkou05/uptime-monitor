import { create } from "zustand";

interface MonitorState {
  searchQuery: string;
  statusFilter: "ALL" | "UP" | "DOWN";
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: "ALL" | "UP" | "DOWN") => void;
  resetFilters: () => void;
}

export const useMonitorStore = create<MonitorState>((set) => ({
  searchQuery: "",
  statusFilter: "ALL",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  resetFilters: () => set({ searchQuery: "", statusFilter: "ALL" }),
}));
