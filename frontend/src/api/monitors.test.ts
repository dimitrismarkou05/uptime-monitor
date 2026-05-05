import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMonitors,
  getMonitor,
  createMonitor,
  updateMonitor,
  deleteMonitor,
} from "./monitors";
import apiClient from "./client";

vi.mock("./client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("monitors API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("getMonitors requests with pagination and returns response with items and total", async () => {
    const mockResponse = {
      items: [
        {
          id: "1",
          url: "https://x.com/",
          interval_seconds: 300,
          is_active: true,
          user_id: "u1",
          alert_status: "UP",
          last_alerted_at: null,
          next_check_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total: 1,
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });
    const result = await getMonitors(0, 10);
    expect(apiClient.get).toHaveBeenCalledWith("/monitors/?skip=0&limit=10");
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("getMonitor requests by id", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: "1" } });
    await getMonitor("1");
    expect(apiClient.get).toHaveBeenCalledWith("/monitors/1");
  });

  it("createMonitor posts payload", async () => {
    const payload = {
      url: "https://x.com",
      interval_seconds: 300,
      is_active: true,
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "1" } });
    await createMonitor(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/monitors/", payload);
  });

  it("updateMonitor patches payload", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: "1" } });
    await updateMonitor("1", { interval_seconds: 600 });
    expect(apiClient.patch).toHaveBeenCalledWith("/monitors/1", {
      interval_seconds: 600,
    });
  });

  it("deleteMonitor sends delete", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});
    await deleteMonitor("1");
    expect(apiClient.delete).toHaveBeenCalledWith("/monitors/1");
  });
});
