import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusIndicator from "./StatusIndicator";
import type { MonitorRead } from "../../types/monitor";
import { formatInterval } from "../../utils/formatters";

interface MonitorListProps {
  monitors: MonitorRead[];
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (monitor: MonitorRead) => void;
}

export default function MonitorList({
  monitors,
  onDelete,
  onToggle,
  onEdit,
}: MonitorListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this monitor?")) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (monitors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">
          No monitors yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-700">Status</th>
            <th className="px-4 py-3 font-medium text-gray-700">URL</th>
            <th className="px-4 py-3 font-medium text-gray-700">Interval</th>
            <th className="px-4 py-3 font-medium text-gray-700">Active</th>
            <th className="px-4 py-3 font-medium text-gray-700 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {monitors.map((monitor) => (
            <tr key={monitor.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <StatusIndicator
                  status={monitor.alert_status as "UP" | "DOWN"}
                />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => navigate(`/monitor/${monitor.id}`)}
                  className="text-blue-600 hover:underline text-left truncate max-w-50 cursor-pointer"
                >
                  {monitor.url}
                </button>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatInterval(monitor.interval_seconds)}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggle(monitor.id, !monitor.is_active)}
                  className={`cursor-pointer relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    monitor.is_active ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      monitor.is_active ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => onEdit(monitor)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(monitor.id)}
                    disabled={deletingId === monitor.id}
                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {deletingId === monitor.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
