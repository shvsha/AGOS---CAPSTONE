"use client"

import { useState } from "react"
import { FaWater, FaExclamationTriangle, FaPlug, FaBatteryQuarter, FaSignal, FaExclamationCircle, FaChevronRight, } from "react-icons/fa"

import { api } from "@/lib/api"
import { getAccessToken } from "@/lib/auth"
import { ALERT_STYLE } from "@/lib/constant"


type ClogContext = {
  dominant_waste_type?: string
  estimated_volume?: number
  confidence?: number
}

type WaterContext = {
  water_level?: number
  water_flow_rate?: number | null
  water_flow?: string
}

type HealthContext = {
  battery_voltage?: number
  signal_strength?: number
  sensor_continuity?: boolean
  health_status?: string
  checked_at?: string
}

type AlertContext = ClogContext | WaterContext | HealthContext | Record<string, never>

export type Alert = {
  alert_id:      number
  alert_type:    string
  node_name:     string | null
  barangay_name: string | null
  timestamp:     string
  is_read:       boolean
  alert_context: AlertContext
}


const ALERT_META: Record<string, { label: string; Icon: React.ElementType }> = {
  Water_Level_Rising: { label: "Abnormal Water Level",  Icon: FaWater             },
  Critical_Clog:      { label: "Critical Clog Detected", Icon: FaExclamationTriangle },
  Node_Offline:       { label: "Node Offline",           Icon: FaPlug              },
  Low_Battery:        { label: "Low Battery",            Icon: FaBatteryQuarter    },
  Weak_Signal:        { label: "Weak Signal",            Icon: FaSignal            },
  Sensor_Failure:     { label: "Sensor Failure",         Icon: FaExclamationCircle },
}


// helpers
function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}


function ContextRow({ alertType, ctx }: { alertType: string; ctx: AlertContext }) {
  if (alertType === "Critical_Clog") {
    const c = ctx as ClogContext
    if (!c.dominant_waste_type && c.estimated_volume == null) return null
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-[#727272]">
        {c.dominant_waste_type && <span>{c.dominant_waste_type}</span>}
        {c.estimated_volume != null && (
          <span>
            Estimated Volume:{" "}
            <span className="font-semibold text-[#122A48]">{c.estimated_volume} kg</span>
          </span>
        )}
        {c.confidence != null && (
          <span className="text-xs">Confidence: {Math.round(c.confidence * 100)}%</span>
        )}
      </div>
    )
  }

  if (alertType === "Water_Level_Rising") {
    const c = ctx as WaterContext
    if (c.water_level == null) return null
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-[#727272]">
        <span>
          Water Level:{" "}
          <span className="font-semibold text-[#122A48]">{c.water_level} cm</span>
        </span>
        {c.water_flow_rate != null && (
          <span>
            Flow Rate:{" "}
            <span className="font-semibold text-[#122A48]">{c.water_flow_rate} m/s</span>
          </span>
        )}
        {c.water_flow && (
          <span>
            Flow: <span className="font-semibold text-[#122A48]">{c.water_flow}</span>
          </span>
        )}
      </div>
    )
  }

  if (["Node_Offline", "Low_Battery", "Weak_Signal", "Sensor_Failure"].includes(alertType)) {
    const c = ctx as HealthContext
    if (!Object.keys(c).length) return null
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-[#727272]">
        {alertType === "Low_Battery" && c.battery_voltage != null && (
          <span>
            Battery:{" "}
            <span className="font-semibold text-[#122A48]">{c.battery_voltage.toFixed(2)} V</span>
          </span>
        )}
        {alertType === "Weak_Signal" && c.signal_strength != null && (
          <span>
            Signal:{" "}
            <span className="font-semibold text-[#122A48]">{c.signal_strength.toFixed(0)} dBm</span>
          </span>
        )}
        {alertType === "Sensor_Failure" && c.sensor_continuity != null && (
          <span>
            Sensor:{" "}
            <span className={`font-semibold ${c.sensor_continuity ? "text-[#347D43]" : "text-[#CC251F]"}`}>
              {c.sensor_continuity ? "OK" : "Disconnected"}
            </span>
          </span>
        )}
        {alertType === "Node_Offline" && (
          <>
            {c.health_status && (
              <span>
                Status: <span className="font-semibold text-[#CC251F]">{c.health_status}</span>
              </span>
            )}
            {c.battery_voltage != null && (
              <span>
                Battery:{" "}
                <span className="font-semibold text-[#122A48]">{c.battery_voltage.toFixed(2)} V</span>
              </span>
            )}
            {c.signal_strength != null && (
              <span>
                Signal:{" "}
                <span className="font-semibold text-[#122A48]">{c.signal_strength.toFixed(0)} dBm</span>
              </span>
            )}
          </>
        )}
      </div>
    )
  }

  return null
}

interface AlertCardProps {
  alert:   Alert
  onRead?: (id: number) => void
}

export function AlertCard({ alert, onRead }: AlertCardProps) {
  const [isRead, setIsRead] = useState(alert.is_read)

  const style  = ALERT_STYLE[alert.alert_type] ?? ALERT_STYLE.default
  const meta   = ALERT_META[alert.alert_type]  ?? { label: alert.alert_type.replace(/_/g, " "), Icon: FaExclamationCircle }
  const { Icon } = meta

  const handleClick = async () => {
    if (isRead) return
    try {
      const token = getAccessToken()
      await api.post(`/api/alerts/${alert.alert_id}/mark-read/`, {}, token ?? undefined)
      setIsRead(true)
      onRead?.(alert.alert_id)
    } catch {
      // silently fail
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        rounded-lg p-4 bg-[#FAFCFD]
        border ${style.border}
        ${style.shadow}
        cursor-pointer transition-opacity
        ${isRead ? "opacity-60" : "opacity-100"}
        hover:opacity-90
      `}
    >
      <div className="flex items-start gap-3">

        {/* icon badge */}
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${style.icon}`}>
          <Icon size={16} />
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">

          {/* top row: label + time + unread dot */}
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold text-sm text-[#122A48] leading-tight">{meta.label.toUpperCase()}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-[#727272]">{formatTime(alert.timestamp)}</span>
              {!isRead && (
                <span className={`w-2 h-2 rounded-full ${style.icon.split(" ")[1]}`} />
              )}
            </div>
          </div>

          {/* barangay + chevron */}
          <div className="flex justify-between items-center mt-0.5">
            <p className="font-semibold text-sm text-[#122A48]">
              {alert.barangay_name ?? "—"}
            </p>
            <FaChevronRight size={11} className="text-[#727272] shrink-0" />
          </div>

          {/* node name */}
          {alert.node_name && (
            <p className="text-xs text-[#727272] mt-0.5">{alert.node_name}</p>
          )}

          {/* contextual data */}
          <div className="mt-1.5">
            <ContextRow alertType={alert.alert_type} ctx={alert.alert_context} />
          </div>

          {/* date */}
          <p className="text-xs text-[#727272] mt-1.5">
            Detected on {formatDate(alert.timestamp)}
          </p>
        </div>

      </div>
    </div>
  )
}