import MonitorForm from "./MonitorForm";
import type { MonitorRead, MonitorUpdate } from "../../types/monitor";

interface EditMonitorModalProps {
  monitor: MonitorRead;
  onSave: (id: string, data: MonitorUpdate) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function EditMonitorModal({
  monitor,
  onSave,
  onClose,
  isLoading,
}: EditMonitorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Monitor
        </h2>
        <MonitorForm
          initialData={{
            url: monitor.url,
            interval_seconds: monitor.interval_seconds,
            is_active: monitor.is_active,
          }}
          onSubmit={(data) =>
            onSave(monitor.id, {
              url: data.url,
              interval_seconds: data.interval_seconds,
              is_active: data.is_active,
            })
          }
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
