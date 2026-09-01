"use client"

import { X } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ALERT_STYLE } from "@/lib/constant"
import { ALERT_META, ContextRow, type Alert } from "@/components/Alerts/AlertCard"

interface AlertDetailDialogProps {
  alert: Alert | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AlertDetailDialog({ alert, open, onOpenChange }: AlertDetailDialogProps) {
  if (!alert) return null

  const style = ALERT_STYLE[alert.alert_type] ?? ALERT_STYLE.default
  const meta  = ALERT_META[alert.alert_type]  ?? { label: alert.alert_type.replace(/_/g, " "), Icon: undefined }
  const Icon  = meta.Icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="[&>button]:hidden text-[#122A48] w-[380px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${style.icon}`}>
                {Icon && <Icon size={16} />}
              </div>
              <p className="font-bold text-sm">{meta.label}</p>
            </div>
            <button onClick={() => onOpenChange(false)} className="cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </DialogHeader>

        <DialogTitle className="sr-only">Alert Details</DialogTitle>
        <hr />

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <p className="text-[#727272]">Node</p>
            <p className="font-medium">{alert.node_name ?? "—"}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#727272]">Barangay</p>
            <p className="font-medium">{alert.barangay_name ?? "—"}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#727272]">Detected</p>
            <p className="font-medium">
              {new Date(alert.timestamp).toLocaleString("en-PH", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true
              })}
            </p>
          </div>

          <hr />
          <p className="font-semibold text-xs text-[#727272]">DETAILS</p>
          <ContextRow alertType={alert.alert_type} ctx={alert.alert_context} />
        </div>
      </DialogContent>
    </Dialog>
  )
}