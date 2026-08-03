import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { SensorNodeApi, ClogEventApi } from "../types/map";
import { WasteClassification } from "../types/analytics";
import { buildComposition } from "../lib/analytics";

const UNRESOLVED_STATUSES = ["Detected", "Responded"];

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useMapData() {
  const [nodes, setNodes] = useState<SensorNodeApi[]>([]);
  const [clogEvents, setClogEvents] = useState<ClogEventApi[]>([]);
  const [classifications, setClassifications] = useState<WasteClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [nodeData, clogData, wasteData] = await Promise.all([
        api.get("/api/sensor-nodes/"),
        api.get("/api/clog-events/"),
        api.get(`/api/waste-classifications/?month=${currentMonthValue()}`),
      ]);
      setNodes(nodeData ?? []);
      setClogEvents(clogData ?? []);
      setClassifications(wasteData ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const mappableNodes = nodes.filter(
    (n) => n.hotspot_details?.latitude != null && n.hotspot_details?.longitude != null
  );

  const criticalCount = nodes.filter((n) => n.condition === "Critical").length;
  const obstructedNodeIds = new Set(
    clogEvents
      .filter((e) => UNRESOLVED_STATUSES.includes(e.status))
      .map((e) => e.node)
  );
  const obstructedCount = obstructedNodeIds.size;

  const awaitingResponseCount = new Set(
    clogEvents.filter((e) => e.status === "Detected").map((e) => e.node)
  ).size;

  const waterLevelReadings = nodes
    .map((n) => n.water_level)
    .filter((v): v is number => v != null);

  const avgWaterLevelCm =
    waterLevelReadings.length > 0
      ? Math.round(
          (waterLevelReadings.reduce((sum, v) => sum + v, 0) / waterLevelReadings.length) * 10
        ) / 10
      : null;

  const stats = {
    monitoringPointsTotal: nodes.length,
    criticalNodesCount: criticalCount,
    obstructedCanalsCount: obstructedCount,
    awaitingResponseCount: awaitingResponseCount,
    averageWaterLevelCm: avgWaterLevelCm,
  };

  const totalWasteKg = Math.round(classifications.reduce((sum, w) => sum + (w.estimated_volume || 0), 0) * 10) / 10;

  const composition = buildComposition(classifications);

  return { nodes, mappableNodes, awaitingResponseCount, stats, totalWasteKg, composition, loading, error, refetch: fetchAll };
}