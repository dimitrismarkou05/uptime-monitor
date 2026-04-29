import { useMonitorPings } from "../../hooks/usePings";

interface UptimeChartProps {
  monitorId: string;
}

export default function UptimeChart({ monitorId }: UptimeChartProps) {
  const { data: pings, isLoading } = useMonitorPings(monitorId, 50);

  if (isLoading) {
    return (
      <div className="h-8 flex items-end gap-1 animate-pulse">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 rounded-sm"
            style={{ height: "60%" }}
          />
        ))}
      </div>
    );
  }

  if (!pings || pings.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">No ping data available yet.</p>
      </div>
    );
  }

  const recentChecks = [...pings].reverse();
  const uptimePercent = Math.round(
    (recentChecks.filter((d) => d.is_up).length / recentChecks.length) * 100,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Last {recentChecks.length} Checks
        </span>
        <span
          className={`text-sm font-semibold ${uptimePercent >= 99 ? "text-emerald-600" : uptimePercent >= 95 ? "text-yellow-600" : "text-red-600"}`}
        >
          {uptimePercent}% uptime
        </span>
      </div>
      <div className="flex gap-0.5 h-10 items-end">
        {recentChecks.map((check, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[1px] transition-all hover:opacity-80 ${
              check.is_up ? "bg-emerald-400" : "bg-red-400"
            }`}
            style={{
              height: check.response_ms
                ? `${Math.min((check.response_ms / 1000) * 100, 100)}%`
                : "100%",
            }}
            title={`${check.is_up ? "UP" : "DOWN"} — ${check.response_ms ?? "N/A"}ms — ${new Date(check.timestamp).toLocaleString()}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{recentChecks.length} checks</span>
        <span>{recentChecks.filter((c) => c.is_up).length} passed</span>
      </div>
    </div>
  );
}
