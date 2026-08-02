import {
  ClogReason,
  Detection,
  WasteClassification,
  WasteVolume,
} from "../types/analytics";

export const wasteVolumes: WasteVolume[] = [
  {
    id: 1,
    title: "Biodegradable",
    value: 18,
    subtitle: "Node 4 dominant",
    icon: "leaf",
  },
  {
    id: 2,
    title: "Recyclable",
    value: 12,
    subtitle: "Node 6 dominant",
    icon: "recycle",
  },
  {
    id: 3,
    title: "Residual",
    value: 7,
    subtitle: "Node 3 dominant",
    icon: "trash",
  },
  {
    id: 4,
    title: "Mixed",
    value: 4,
    subtitle: "Node 1 only",
    icon: "package",
  },
];

export const detections: Detection[] = [
  {
    id: 1,
    severity: "Critical",
    node: "Node 4",
    location: "Purok 1",
    description: "High volume",
    status: "Detected",
  },
  {
    id: 2,
    severity: "Warning",
    node: "Node 2",
    location: "Purok 2",
    description: "Moderate volume",
    status: "Detected",
  },
  {
    id: 3,
    severity: "Warning",
    node: "Node 3",
    location: "Purok 3",
    description: "Moderate volume",
    status: "Detected",
  },
  {
    id: 4,
    severity: "Clear",
    node: "Node 1",
    location: "Purok 3",
    description: "None",
    status: "Clear",
  },
];

export const classifications: WasteClassification[] = [
  {
    id: 1,
    type: "Biodegradable",
    percent: 43,
    color: "#59C36A",
    icon: "leaf",
  },
  {
    id: 2,
    type: "Recyclable",
    percent: 36,
    color: "#63A5FF",
    icon: "recycle",
  },
  {
    id: 3,
    type: "Residual",
    percent: 68,
    color: "#D89A5D",
    icon: "trash",
  },
  {
    id: 4,
    type: "Mixed",
    percent: 53,
    color: "#EF5B5B",
    icon: "package",
  },
];

export const clogReasons: ClogReason[] = [
  {
    id: 1,
    title: "Physical Obstruction",
    incidents: 5,
    description: "Solid debris blocking flow",
    percentage: 35,
    color: "#EF4444",
  },
  {
    id: 2,
    title: "Seasonal Water Surge",
    incidents: 2,
    description: "Overflow from heavy rainfall",
    percentage: 29,
    color: "#3B82F6",
  },
];
