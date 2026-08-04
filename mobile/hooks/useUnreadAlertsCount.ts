import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../lib/api";

const POLL_INTERVAL_MS = 30000;

export function useUnreadAlertsCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.get("/api/alerts/unread-count/");
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // fail silently, badge just won't update this cycle
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [fetchUnreadCount])
  );

  return unreadCount;
}