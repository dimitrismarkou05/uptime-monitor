import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncUser, getMe, deleteAccount } from "./users";
import apiClient from "./client";

vi.mock("./client");

describe("users API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("syncUser posts to sync", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "1" } });
    await syncUser();
    expect(apiClient.post).toHaveBeenCalledWith("/users/sync");
  });

  it("getMe fetches profile", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: "1" } });
    await getMe();
    expect(apiClient.get).toHaveBeenCalledWith("/users/me");
  });

  it("deleteAccount sends delete", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});
    await deleteAccount();
    expect(apiClient.delete).toHaveBeenCalledWith("/users/me");
  });
});
