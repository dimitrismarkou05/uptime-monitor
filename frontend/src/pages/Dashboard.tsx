import { useState } from "react";
import DashboardShell from "../components/layout/DashboardShell";
import MonitorList from "../components/monitors/MonitorList";
import MonitorForm from "../components/monitors/MonitorForm";
import UptimeChart from "../components/monitors/UptimeChart";
import {
  useMonitors,
  useCreateMonitor,
  useUpdateMonitor,
  useDeleteMonitor,
} from "../hooks/useMonitors";
import type { MonitorCreate } from "../types/monitor";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const { data: monitors, isLoading, error } = useMonitors();
  const createMonitor = useCreateMonitor();
  const updateMonitor = useUpdateMonitor();
  const deleteMonitor = useDeleteMonitor();

  const handleCreate = async (data: MonitorCreate) => {
    await createMonitor.mutateAsync(data);
    setShowForm(false);
  };

  const handleToggle = (id: string, isActive: boolean) => {
    updateMonitor.mutate({ id, data: { is_active: isActive } });
  };

  const handleDelete = async (id: string) => {
    await deleteMonitor.mutateAsync(id);
  };

  // Aggregate all ping logs for a simple overview chart
  const allPings = monitors?.flatMap(() => []) ?? [];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitors</h1>
            <p className="text-sm text-gray-600 mt-1">
              {monitors?.length ?? 0} active monitor
              {monitors?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Monitor
          </button>
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              New Monitor
            </h2>
            <MonitorForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isLoading={createMonitor.isPending}
            />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            Failed to load monitors.{" "}
            <button
              onClick={() => window.location.reload()}
              className="underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Monitor List */}
        {monitors && (
          <MonitorList
            monitors={monitors}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        )}

        {/* Overview Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Uptime Overview
          </h2>
          <UptimeChart data={allPings} />
        </div>
      </div>
    </DashboardShell>
  );
}
