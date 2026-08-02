import { Ionicons } from "@expo/vector-icons";

import { AlertType, ClogTier } from "../types/alert";

export const ALERT_META: Record<AlertType, { label: string; icon: keyof typeof Ionicons.glyphMap; tier: ClogTier | null }> = {
  Water_Level_Rising: {
    label: "Water Level Rising",
    icon: "water-outline",
    tier: null,
  },
  Low_Clog_Alert: {
    label: "Low Clog Detected",
    icon: "warning-outline",
    tier: "Low",
  },
  Moderate_Clog_Alert: {
    label: "Moderate Clog Detected",
    icon: "warning-outline",
    tier: "Moderate",
  },
  Critical_Clog: {
    label: "Critical Clog Detected",
    icon: "warning-outline",
    tier: "Critical",
  },
};

export const ALERT_STYLE: Record<AlertType, { indicator: string; badgeBg: string; badgeText: string}> ={
  Water_Level_Rising: {
    indicator: "#1565BC",
    badgeBg: "bg-[#D6E8FF]",
    badgeText: "text-[#1565BC]",
  },
  Low_Clog_Alert: {
    indicator: "#D2A000",
    badgeBg: "bg-[#FFF9DC]",
    badgeText: "text-[#D2A000]",
  },
  Moderate_Clog_Alert: {
    indicator: "#E65100",
    badgeBg: "bg-[#FFF0D6]",
    badgeText: "text-[#E65100]",
  },
  Critical_Clog: {
    indicator: "#D81010",
    badgeBg: "bg-[#FFE5E5]",
    badgeText: "text-[#D81010]",
  },
};