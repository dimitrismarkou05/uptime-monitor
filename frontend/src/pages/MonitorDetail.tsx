import { useParams, useNavigate } from "react-router-dom";
import { useMonitor } from "../hooks/useMonitors";
import { useMonitorStats, useMonitorPings } from "../hooks/usePings";
import { formatPercentage, formatDateTime } from "../utils/formatters";
import DashboardShell from "../components/layout/DashboardShell";
import StatusIndicator from "../components/monitors/StatusIndicator";
import UptimeChart from "../components/monitors/UptimeChart";

export default function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: monitor, isLoading: monitorLoading } = useMonitor(id!);
  const { data: stats } = useMonitorStats(id!);
  const { data: pings } = useMonitorPings(id!, 10);

  if (monitorLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardShell>
    );
  }

  if (!monitor) {
    return (
      <DashboardShell>
        <div className="text-center py-12">
          <p className="text-gray-500">Monitor not found</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{monitor.url}</h1>
          </div>
          <StatusIndicator status={monitor.alert_status} />
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Uptime"
              value={formatPercentage(stats.uptime_percent)}
            />
            <StatCard label="Checks" value={String(stats.total_checks)} />
            <StatCard
              label="Avg Response"
              value={
                stats.avg_response_ms ? `${stats.avg_response_ms}ms` : "N/A"
              }
            />
            <StatCard
              label="24h Uptime"
              value={formatPercentage(stats.last_24h.uptime_percent)}
            />
          </div>
        )}

        {/* Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Response Time
          </h2>
          <UptimeChart monitorId={id!} />
        </div>

        {/* Recent Pings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Checks
          </h2>
          <div className="space-y-2">
            {pings?.map((ping) => (
              <div
                key={ping.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${ping.is_up ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  <span className="text-sm text-gray-600">
                    {formatDateTime(ping.timestamp)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {ping.status_code && (
                    <span className="mr-3">HTTP {ping.status_code}</span>
                  )}
                  {ping.response_ms && <span>{ping.response_ms}ms</span>}
                  {ping.error_message && (
                    <span className="text-red-500">{ping.error_message}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
