import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../api/client";

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleCreateMonitor = async () => {
    try {
      const response = await apiClient.post("/monitors/", {
        url: "https://google.com",
        interval_seconds: 300,
        is_active: true,
      });
      console.log("Created:", response.data);
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <p>Welcome, {user?.email}</p>
      <button
        onClick={handleCreateMonitor}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Google Monitor
      </button>
    </div>
  );
}
