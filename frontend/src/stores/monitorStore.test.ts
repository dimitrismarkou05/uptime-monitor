import { describe, it, expect, beforeEach } from "vitest";
import { useMonitorStore } from "./monitorStore";

describe("monitorStore", () => {
  beforeEach(() => {
    useMonitorStore.setState({ searchQuery: "", statusFilter: "ALL" });
  });

  it("initializes with defaults", () => {
    const s = useMonitorStore.getState();
    expect(s.searchQuery).toBe("");
    expect(s.statusFilter).toBe("ALL");
  });

  it("sets search query", () => {
    useMonitorStore.getState().setSearchQuery("google");
    expect(useMonitorStore.getState().searchQuery).toBe("google");
  });

  it("sets status filter", () => {
    useMonitorStore.getState().setStatusFilter("DOWN");
    expect(useMonitorStore.getState().statusFilter).toBe("DOWN");
  });

  it("resets filters", () => {
    const store = useMonitorStore.getState();
    store.setSearchQuery("q");
    store.setStatusFilter("UP");
    store.resetFilters();
    expect(useMonitorStore.getState().searchQuery).toBe("");
    expect(useMonitorStore.getState().statusFilter).toBe("ALL");
  });
});
