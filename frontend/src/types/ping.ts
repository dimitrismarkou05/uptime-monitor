export interface PingLogRead {
  id: string;
  monitor_id: string;
  timestamp: string;
  status_code: number | null;
  response_ms: number | null;
  is_up: boolean;
  error_message: string | null;
}

export interface PingStats {
  total_checks: number;
  uptime_count: number;
  uptime_percent: number;
  avg_response_ms: number | null;
  last_24h: {
    checks: number;
    uptime_percent: number;
  };
}
