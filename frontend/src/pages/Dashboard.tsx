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
import { useMonitorStore } from "../stores/monitorStore";

const PAGE_SIZE = 10;

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<MonitorRead | null>(
    null,
  );
  const [page, setPage] = useState(0);

  const {
    data: monitors,
    isLoading,
    error,
  } = useMonitors(page * PAGE_SIZE, PAGE_SIZE);
  const createMonitor = useCreateMonitor();
  const updateMonitor = useUpdateMonitor();
  const deleteMonitor = useDeleteMonitor();

  const { searchQuery, statusFilter, setSearchQuery, setStatusFilter } =
    useMonitorStore();

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

  // We filter the current page locally. (For massive datasets, this logic
  // should ideally be moved to backend queries, but this handles the visual state).
  const filteredMonitors = monitors?.filter((m) => {
    const matchesSearch = m.url
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || m.alert_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const upCount = monitors?.filter((m) => m.alert_status === "UP").length ?? 0;
  const downCount =
    monitors?.filter((m) => m.alert_status === "DOWN").length ?? 0;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitors</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-medium text-green-600">
                {upCount} UP
              </span>
              <span className="text-sm font-medium text-red-600">
                {downCount} DOWN
              </span>
            </div>
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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Search URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ALL" | "UP" | "DOWN")
                }
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="UP">Up Only</option>
                <option value="DOWN">Down Only</option>
              </select>
            </div>

            <MonitorList
              monitors={filteredMonitors || []}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onEdit={(m) => setEditingMonitor(m)}
            />

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!monitors || monitors.length < PAGE_SIZE}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
