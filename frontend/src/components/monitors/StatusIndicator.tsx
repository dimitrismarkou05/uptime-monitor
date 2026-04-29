interface StatusIndicatorProps {
  status: "UP" | "DOWN";
  pulse?: boolean;
}

export default function StatusIndicator({
  status,
  pulse = true,
}: StatusIndicatorProps) {
  const isUp = status === "UP";

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`relative flex h-2.5 w-2.5 rounded-full ${
          isUp ? "bg-emerald-500" : "bg-red-500"
        }`}
      >
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
              isUp ? "bg-emerald-400" : "bg-red-400"
            }`}
          />
        )}
      </span>
      <span
        className={`text-sm font-medium ${
          isUp ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {status}
      </span>
    </span>
  );
}
