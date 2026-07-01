export const DIALOG_COLOR = {
  primary: '#122A48',
  gray: '#727272',
  lightgray: '#72727247',

  green: '#347D43',
  red: '#CC251F',
  lightgreen: '#58D07159',
  lightred: '#FDD1D2',
  yellow: '#D27000',
  lightyellow: '#EE9E4342',
  blue: '#1565BC',
  lightblue: '#1565BC29',
  lightorange: '#FFF3E0',
  orange: '#E65100',
}

// alert styles
export const ALERT_STYLE: Record<string, { border: string; icon: string; shadow: string }> = {
  Water_Level_Rising: {
    border: "border-[#FFD6A0]",
    icon: "bg-[#FFF0D6] text-[#FF9705]",
    shadow: "shadow-[0_0_3px_rgba(255,151,5,0.57)]"
  },
  High_Clog_Index: {
    border: "border-[#FF6A00]",
    icon: "bg-[#FFD6A0] text-[#D27000]",
    shadow: "shadow-[0_0_3px_rgba(255,106,0,0.57)]"
  },
  Critical_Clog: {
    border: "border-[#FFD6D6]",
    icon: "bg-[#FFE5E5] text-[#D81010]",
    shadow: "shadow-[0_0_3px_rgba(216,16,16,0.35)]"
  },
  Node_Offline: {
    border: "border-[#FFD6D6]",
    icon: "bg-[#FFE5E5] text-[#D81010]",
    shadow: "shadow-[0_0_3px_rgba(216,16,16,0.50)]"
  },
  Low_Battery: {
    border: "border-[#F4E4A7]",
    icon: "bg-[#FFF9DC] text-[#FF9705]",
    shadow: "shadow-[0_0_3px_rgba(255,151,5,0.75)]"
  },
  Weak_Signal: {
    border: "border-[#F4E4A7]",
    icon: "bg-[#FFF9DC] text-[#FF9705]",
    shadow: "shadow-[0_0_3px_rgba(255,151,5,0.45)]"
  },
  Sensor_Failure: {
    border: "border-[#FFD6D6]",
    icon: "bg-[#FFE5E5] text-[#D81010]",
    shadow: "shadow-[0_0_3px_rgba(216,16,16,0.60)]"
  },
  default: {
    border: "border-[#C6C6C8]",
    icon: "bg-[#E5E5E6] text-[#727272]",
    shadow: "shadow-[0_0_3px_rgba(114,114,114,0.25)]"
  },
}

export function getConditionClass(condition: string) {
  switch (condition) {
    case "Critical": return "text-[#D81010]"
    case "Warning":  return "text-[#FF9705]"
    case "Normal":   return "text-[#1565BC]"
    default:         return "text-[#727272]"
  }
}

export function getClogClass(clog: number | null) {
  if (clog == null) return "text-[#727272]"
  if (clog >= 75)   return "text-[#D81010] font-semibold"
  if (clog >= 50)   return "text-[#FF9705] font-semibold"
  return "text-[#1565BC]"
}

export function getStatusClass(status: string) {
  switch (status) {
    case "Active":      return "text-[#2C7B3C] bg-[#58D07159]"
    case "Inactive":    return "text-[#727272] bg-[#D9D9D9]"
    case "Maintenance": return "text-[#582579] bg-[#DACDE3]"
    default:            return "text-[#2C7B3C] bg-[#58D07159]"
  }
}

export function getDotClass(status: string) {
  switch (status) {
    case "Active":      return "bg-[#2C7B3C]"
    case "Inactive":    return "bg-[#727272]"
    case "Maintenance": return "bg-[#582579]"
    default:            return "bg-[#2C7B3C]"
  }
}