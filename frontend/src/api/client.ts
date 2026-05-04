import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import { refreshSession, isTokenExpiringSoon } from "./auth";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("access_token");

  // Proactive refresh: if token is expiring soon and this isn't the refresh call itself
  if (token && isTokenExpiringSoon() && !config.url?.includes("/auth/")) {
    try {
      const newToken = await refreshSession();
      config.headers.Authorization = `Bearer ${newToken}`;
      return config;
    } catch {
      // Proactive refresh failed; let response interceptor handle 401
      void 0;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401s that haven't been retried yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        try {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      let newToken: string;

      // Only wrap the actual refresh operation in the try/catch
      try {
        refreshPromise = refreshSession();
        newToken = await refreshPromise;
        if (!newToken) {
          throw new Error("Session refresh returned empty token");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Graceful state wipe triggering React Router redirect
        useAuthStore.getState().logout();
        isRefreshing = false;
        refreshPromise = null;
        return Promise.reject(refreshError);
      }

      // Success path execution
      isRefreshing = false;
      refreshPromise = null;

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      // Returning the un-awaited Promise here avoids catching retry failures
      // as "refresh failures" and safely sidesteps the V8 coverage glitch.
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
