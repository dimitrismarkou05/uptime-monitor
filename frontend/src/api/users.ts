import apiClient from "./client";
import type { UserRead } from "../types/user";

export async function syncUser(): Promise<UserRead> {
  const { data } = await apiClient.post("/users/sync");
  return data;
}

export async function getMe(): Promise<UserRead> {
  const { data } = await apiClient.get("/users/me");
  return data;
}
