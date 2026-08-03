import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { RainfallCondition, FloodRiskLevel, RAINFALL_TO_RISK } from "../constants/rainfall";

export function useRainfallCondition() {
  const [riskLevel, setRiskLevel] = useState<FloodRiskLevel | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCondition = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/rainfall-condition/");
      const condition = data.condition as RainfallCondition;
      setRiskLevel(RAINFALL_TO_RISK[condition] ?? "Unknown");
    } catch {
      setRiskLevel("Unknown");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCondition();
  }, [fetchCondition]);

  return { riskLevel, loading, refetch: fetchCondition };
}