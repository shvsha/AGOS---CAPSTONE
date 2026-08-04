import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { WasteClassification } from "../types/analytics";

import { useLiveSocket } from "../lib/useLiveSocket";
import { useAuth } from "../lib/AuthContext";

export interface AnalyticsNode {
  node_id: number;
  node_name: string;
  location: string;
}

export function useAnalytics(selectedMonth: string) {
  const [classifications, setClassifications] = useState<WasteClassification[]>([]);
  const [liveClassifications, setLiveClassifications] = useState<WasteClassification[]>([]);
  const [nodes, setNodes] = useState<AnalyticsNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const { user } = useAuth();

  const fetchAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(false);
    try {
      const currentMonth = `${new Date().getFullYear()}-${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}`;

      const requests = [
        api.get(`/api/waste-classifications/?month=${selectedMonth}`),
        api.get(`/api/sensor-nodes/`),
      ];

      if (selectedMonth !== currentMonth) {
        requests.push(api.get(`/api/waste-classifications/?month=${currentMonth}`));
      }

      const [classificationData, nodeData, liveData] = await Promise.all(requests);

      setClassifications(classificationData ?? []);
      setNodes((nodeData.results ?? nodeData ?? []).map((n: any) => ({
        node_id: n.node_id,
        node_name: n.node_name,
        location: n.hotspot_details?.name ?? n.node_name,
      })));
      setLiveClassifications(
        selectedMonth === currentMonth ? classificationData ?? [] : liveData ?? []
      );
    } catch {
      setError(true);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useLiveSocket<WasteClassification>(
    'ws/waste-classification/',
    (incoming) => {
      if (
        user?.user_role === 'Barangay' &&
        incoming.node_details?.barangay_details?.barangay_id != null &&
        incoming.node_details.barangay_details.barangay_id !== user.barangay_id
      ) {
        return;
      }

      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

      setLiveClassifications((prev) => [incoming, ...prev]);

      if (selectedMonth === currentMonth) {
        setClassifications((prev) => [incoming, ...prev]);
      }
    },
    () => fetchAll()
  );

  return { classifications, liveClassifications, nodes, loading, refreshing, error, refetch: fetchAll };
}