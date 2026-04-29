/**
 * Formats a given number of seconds into a human-readable interval (e.g., "5m", "1h")
 */
export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

/**
 * Formats a decimal/fraction into a clean percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${Number(value.toFixed(decimals))}%`;
}

/**
 * Standardizes datetime display across the app
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
