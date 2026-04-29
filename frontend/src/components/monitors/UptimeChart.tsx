interface UptimeChartProps {
  data?: { timestamp: string; is_up: boolean }[];
}

export default function UptimeChart({ data }: UptimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">No ping data available yet.</p>
      </div>
    );
  }

  // Show last 20 checks as bars
  const recentChecks = data.slice(-20);
  const uptimePercent = Math.round(
    (recentChecks.filter((d) => d.is_up).length / recentChecks.length) * 100,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Last 20 Checks
        </span>
        <span className="text-sm text-gray-600">{uptimePercent}% uptime</span>
      </div>
      <div className="flex gap-1 h-8 items-end">
        {recentChecks.map((check, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm min-w-[4px] ${
              check.is_up ? "bg-emerald-400" : "bg-red-400"
            }`}
            style={{ height: "100%" }}
            title={new Date(check.timestamp).toLocaleString()}
          />
        ))}
      </div>
    </div>
  );
}
