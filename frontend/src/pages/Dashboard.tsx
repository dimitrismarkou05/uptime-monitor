import { useState } from "react";
import DashboardShell from "../components/layout/DashboardShell";
import MonitorList from "../components/monitors/MonitorList";
import MonitorForm from "../components/monitors/MonitorForm";
import EditMonitorModal from "../components/monitors/EditMonitorModal";
import {
  useMonitors,
  useCreateMonitor,
  useUpdateMonitor,
  useDeleteMonitor,
} from "../hooks/useMonitors";
import type {
  MonitorCreate,
  MonitorUpdate,
  MonitorRead,
} from "../types/monitor";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<MonitorRead | null>(
    null,
  );

  const { data: monitors, isLoading, error } = useMonitors();
  const createMonitor = useCreateMonitor();
  const updateMonitor = useUpdateMonitor();
  const deleteMonitor = useDeleteMonitor();

  const handleCreate = async (data: MonitorCreate) => {
    await createMonitor.mutateAsync(data);
    setShowForm(false);
  };

  const handleEdit = (id: string, data: MonitorUpdate) => {
    updateMonitor.mutate({ id, data });
    setEditingMonitor(null);
  };

  const handleToggle = (id: string, isActive: boolean) => {
    updateMonitor.mutate({ id, data: { is_active: isActive } });
  };

  const handleDelete = async (id: string) => {
    await deleteMonitor.mutateAsync(id);
  };

  const upCount = monitors?.filter((m) => m.alert_status === "UP").length ?? 0;
  const downCount =
    monitors?.filter((m) => m.alert_status === "DOWN").length ?? 0;

  return (
    <DashboardShell>
      <div className="space-y-6">
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

        {editingMonitor && (
          <EditMonitorModal
            monitor={editingMonitor}
            onSave={handleEdit}
            onClose={() => setEditingMonitor(null)}
            isLoading={updateMonitor.isPending}
          />
        )}

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

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {monitors && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monitors.length}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Up</p>
                <p className="text-2xl font-bold text-emerald-600">{upCount}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Down</p>
                <p className="text-2xl font-bold text-red-600">{downCount}</p>
              </div>
            </div>

            <MonitorList
              monitors={monitors}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onEdit={(m) => setEditingMonitor(m)}
            />
          </>
        )}
      </div>
    </DashboardShell>
  );
}
