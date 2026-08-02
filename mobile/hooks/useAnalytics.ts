import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { WasteClassification } from "../types/analytics";

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
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { classifications, liveClassifications, nodes, loading, error, refetch: fetchAll };
}