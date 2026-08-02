import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { Alert, AlertType } from "../types/alert";

export type AlertTypeFilter = "All" | AlertType;
export type DateFilter = "Today" | "7Days" | "30Days";

const ALL_ALERT_TYPES: AlertType[] = [
  "Water_Level_Rising",
  "Low_Clog_Alert",
  "Moderate_Clog_Alert",
  "Critical_Clog",
];

export function useAlerts(alertType: AlertTypeFilter, dateFilter: DateFilter) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      params.append(
        "alert_type",
        alertType === "All" ? ALL_ALERT_TYPES.join(",") : alertType
      );
      if (dateFilter) params.append("date", dateFilter);

      const data = await api.get(`/api/alerts/?${params.toString()}`);
      setAlerts(data.results ?? data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [alertType, dateFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAsRead = useCallback(async (alertId: number) => {
    try {
      await api.post(`/api/alerts/${alertId}/read/`);
      setAlerts((prev) =>
        prev.map((a) =>
          a.alert_id === alertId ? { ...a, is_read: true } : a
        )
      );
    } catch {
      
    }
  }, []);

  return { alerts, loading, error, refetch: fetchAlerts, markAsRead };
}