export interface MonitorCreate {
  url: string;
  interval_seconds: number;
  is_active: boolean;
}

export interface MonitorUpdate {
  url?: string;
  interval_seconds?: number;
  is_active?: boolean;
}

export interface MonitorRead {
  id: string;
  user_id: string;
  url: string;
  interval_seconds: number;
  is_active: boolean;
  alert_status: "UP" | "DOWN";
  last_alerted_at: string | null;
  next_check_at: string | null;
  created_at: string;
  updated_at: string;
}
