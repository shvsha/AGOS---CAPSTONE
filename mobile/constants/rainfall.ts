export type RainfallCondition = "None" | "Yellow" | "Orange" | "Red" | "Unknown";
export type FloodRiskLevel = "None" | "Low" | "Medium" | "High" | "Unknown";

export const RAINFALL_TO_RISK: Record<RainfallCondition, FloodRiskLevel> = {
  None: "None",
  Yellow: "Low",
  Orange: "Medium",
  Red: "High",
  Unknown: "Unknown",
};

export const RISK_STYLE: Record<FloodRiskLevel, { label: string; bg: string; text: string; border: string }> = {
  None: { label: "None", bg: "#EAF7EE", text: "#2C7B3C", border: "#58D071" },
  Low: { label: "Low", bg: "#FFF9DC", text: "#D2A000", border: "#D2A000" },
  Medium: { label: "Medium", bg: "#FFF0D6", text: "#E65100", border: "#E65100" },
  High: { label: "High", bg: "#FFE5E5", text: "#D81010", border: "#D81010" },
  Unknown: { label: "Unknown", bg: "#F0F0F0", text: "#727272", border: "#727272" },
};