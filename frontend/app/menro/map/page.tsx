"use client"

// react
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// components
import AgosMapWrapper from "@/components/Map/AgosMapWrapper"
import { ALERT_STYLE } from "@/lib/constant"

// auth
import { fetchWithAuth } from "@/lib/auth"

// shadcn
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// icons
import { Siren, Activity, RadioTower, TriangleAlert, MapPin, Droplet, Waves, BatteryMedium, Signal, Radar   } from "lucide-react"


const ALERT_ICONS: Record<string, JSX.Element> = {
  Water_Level_Rising: <Activity size={18} />,
  Critical_Clog:      <RadioTower size={18} />,
  Node_Offline:       <TriangleAlert size={18} />,
  Low_Battery:        <TriangleAlert size={18} />,
  Weak_Signal:        <Activity size={18} />,
  Sensor_Failure:     <RadioTower size={18} />,
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    Normal:   "bg-[#58D07159] text-[#2C7B3C]",
    Warning:  "bg-[#D8921059] text-[#D48A00]",
    Critical: "bg-[#D8101059] text-[#D81010]",
  }
  const style = styles[status] ?? "bg-gray-100 text-gray-500"

  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${style}`}>
      {status}
    </span>
  )
}

function getBatteryPct(voltage: number) {
  const min = 3.0, max = 4.2
  return Math.min(100, Math.max(0, Math.round(((voltage - min) / (max - min)) * 100)))
}

function getBarColor(pct: number) {
  if (pct >= 60) return "bg-[#4ADE80]"
  if (pct >= 30) return "bg-[#F5C518]"
  return "bg-[#F87171]"
}



type SensorNodes = {
  node_id: number
  barangay_details: { barangay_id: number; barangay_name: string } | null
  node_name: string
  latitude: number
  longitude: number
  status: string
  installed_at: string
  condition: string | null
  water_level: number | null
  water_flow_rate: number | null
  clog_pct: number | null
  health_status: string
  health?: NodeHealth
}

type NodeHealth = {
  health_id: number
  node_details: {
    node_id: number
    node_name: string
    status: string
    latitude: number
    longitude: number
    barangay_details: {
      barangay_id: number
      barangay_name: string
    }
  }
  battery_voltage?: number
  signal_strength?: number
  sensor_continuity?: boolean
  status?: string
  checked_at?: string
}

type Alert = {
  alert_id: number
  alert_type: string
  node_name: string | null
  barangay_name: string | null
  timestamp: string
  is_read: boolean
}

type Dialog = {
  open: boolean
}

export default function Map() {
  const router = useRouter()

  // data state
  const [allSensorNodes, setAllSensorNodes] = useState<SensorNodes[]>([])
  const [allSensorHealth, setAllSensorHealth] = useState<NodeHealth[]>([])
  const [allAlerts, setAllAlerts] = useState<Alert[]>([])
  
  // dialog state
  const [selectedNode, setSelectedNode] = useState<SensorNodes | null>(null)
  const [nodeDialog, setNodeDialog] = useState({ open: false })

  // helpers
  const health = allSensorHealth.find(h => h.node_details.node_id === selectedNode?.node_id)
  const voltage = health?.battery_voltage
  const pct = voltage != null ? getBatteryPct(voltage) : null
  const signal = health?.signal_strength  // e.g. -75 dBm
  const signalPct = signal != null 
    ? Math.min(100, Math.max(0, Math.round(((signal + 100) / 60) * 100)))
    : null
  const sensorOk = health?.sensor_continuity

  // fetch sensor nodes
  const fetchSensorNodes = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllSensorNodes(data.results ?? data)
    } catch {}
  }

  // fetch node health
  const fetchNodeHealth = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/system-health/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const results = data.results ?? data
      setAllSensorHealth(results)
    } catch {}
  }

  useEffect(() => {
    fetchSensorNodes()
    fetchNodeHealth()
  }, [])

  // handlers
  const handleSelectNode = (nodeId: number) => {
    const node = allSensorNodes.find(n => n.node_id === nodeId)
    if (!node) return

    const health = allSensorHealth.find(h => h.node_details.node_id === nodeId)

    setSelectedNode({ ...node, health })  // merge health in
    setNodeDialog({ open: true })
  }

  const todayAlerts = allAlerts.filter(alert => {
    const alertDate = new Date(alert.timestamp)
    const today = new Date()
    return (
      alertDate.getFullYear() === today.getFullYear() &&
      alertDate.getMonth() === today.getMonth() &&
      alertDate.getDate() === today.getDate()
    )
  })


  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* root container */}
        <div className="text-[#122A48] flex gap-2 h-[calc(98vh-theme(spacing.16))]">
          {/* map */}
          <div className="bg-[#FAFCFD] rounded-lg border border-[#C6C6C8] flex-1 min-w-0 flex flex-col">
            <div className="w-full p-2 shrink-0">
              <p className="text-sm font-bold">Canal Network Map - Rosario, La Union</p>
            </div>

            <div className="flex-1 overflow-hidden">
              <AgosMapWrapper
                markers={allSensorNodes.map(n => ({
                  latitude:  n.latitude,
                  longitude: n.longitude,
                  label:     n.node_name,
                  condition: n.health_status ?? 'Normal',
                  onMarkerClick: () => handleSelectNode(n.node_id)
                }))}
                zoom={13}
                colorMode="health"
              />
            </div>

          </div>
          
          {/* alert */}
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-67 rounded-lg flex flex-col'>
            <div className='flex justify-between items-center p-3'>
              <p className='font-semibold text-[#122A48]'>Live Alerts</p>
              <Button
                onClick={() => router.push('/admin/alerts')}
                className='rounded-lg shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] text-[#122A48] flex gap-2 bg-white hover:bg-white/50 cursor-pointer border border-[#C9C9C9]'
              >
                <Siren size={20} className='text-[#D81010]' />
                View Alerts
              </Button>
            </div>
            <hr className='border-[#C6C6C8]' />
            <div className='flex flex-col gap-3 p-3 overflow-y-auto'>
              {todayAlerts.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full py-60 gap-2'>
                  <Siren size={28} color="#C6C6C8" />
                  <p className='text-xs text-[#727272] text-center'>No alerts today</p>
                </div>
              ) : (
                todayAlerts.slice(0, 6).map(alert => {
                  const style = ALERT_STYLE[alert.alert_type] ?? ALERT_STYLE.default
                  return (
                    <div key={alert.alert_id} className={`flex items-center gap-3 p-1 rounded-lg border ${style.border} ${style.shadow} ${alert.is_read ? 'opacity-60' : 'bg-white'}`}>
                      <div className={`p-2 rounded-lg ${style.icon} shrink-0`}>
                        {ALERT_ICONS[alert.alert_type] ?? <Activity size={18} />}
                      </div>
                      <div className='flex flex-col'>
                        <p className='text-xs font-semibold text-[#122A48] leading-tight'>
                          {alert.alert_type.replace(/_/g, ' ')} — {alert.node_name ?? 'Unknown Node'}
                        </p>
                        <p className='text-xs text-[#727272]'>
                          {new Date(alert.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} | {alert.barangay_name ?? '—'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Node Dialog */}
      <Dialog open={nodeDialog.open} onOpenChange={(open) => setNodeDialog({ open })}>
          <DialogContent className="w-[300px] text-[#122A48]">
          <DialogHeader className="pr-8 -mb-2">
            <DialogTitle className="flex items-center justify-between gap-2 font-bold">
              <div className="flex gap-2">
                <MapPin size={18} />
                <p className="text-sm">{selectedNode?.barangay_details?.barangay_name}</p>
              </div>
              <div>
                <p className="text-sm">{selectedNode?.node_name}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <hr />
          
          <div className="flex flex-col gap-1 -mt-1">
            <div className="flex justify-between">
              <p>Status:</p>
              {getStatusBadge(selectedNode?.health_status ?? 'Normal')}
            </div>
            <div className="flex justify-between">
              <p>Clog Detection:</p>
              <p>{selectedNode?.clog_pct ?? '- '}%</p>
            </div>
            <div className="flex justify-between">
              <p>Last Updated:</p>
              {/* .... */}
            </div>
          </div>

          <hr />

          <div className="flex gap-7 -mt-1">
            {/* water level */}
            <div>
              <div className="flex gap-1 items-center border-r">
                <Droplet size={20} className="text-[#1565BC]"/>
                <p className="text-center">Water Level:</p>
              </div>

              <div className="flex justify-center mt-2">
                <p className="font-medium">{selectedNode?.water_level ?? '- '} m</p>
              </div>

            </div>
            
            {/* water flow rate */}
            <div>
              <div className="flex gap-1 items-center border-l">
                <Waves size={20} className="text-[#1565BC]"/>
                <p className="text-center">Water Flow:</p>
              </div>

              <div className="flex justify-center mt-2">
                <p className="font-medium">{selectedNode?.water_flow_rate ?? '- '} m/s</p>
              </div>
            </div>
          </div>

          <hr />

          <div className="-mt-1">
            <div className="w-full">
              <p>Node Health:</p>
            </div>

            <div className="mt-1 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <BatteryMedium size={16} className="shrink-0" />
                <p className="text-[13px] w-28 shrink-0">Battery Voltage</p>
                <div className="flex-1 bg-[#E5E5E6] rounded-full h-2">
                  {pct != null && (
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getBarColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
                <p className="text-[13px] w-8 text-right shrink-0">
                  {pct != null ? `${pct}%` : '—%'}
                </p>
              </div>

              {/* Signal */}
              <div className="flex items-center gap-2">
                <Signal size={16} className="shrink-0" />
                <p className="text-[13px] w-28 shrink-0">Signal</p>
                <div className="flex-1 bg-[#E5E5E6] rounded-full h-2">
                  {signalPct != null && (
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getBarColor(signalPct)}`}
                      style={{ width: `${signalPct}%` }}
                    />
                  )}
                </div>
                <p className="text-[13px] w-8 text-right shrink-0">
                  {signalPct != null ? `${signalPct}%` : '—%'}
                </p>
              </div>

              {/* Sensor Continuity */}
              <div className="flex items-center gap-2">
                <Radar size={16} className="shrink-0" />
                <p className="text-[13px] w-28 shrink-0">Continuity</p>
                <div className="flex-1 bg-[#E5E5E6] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      sensorOk ? 'bg-[#4ADE80]' : 'bg-[#F87171]'
                    }`}
                    style={{ width: sensorOk != null ? '100%' : '0%' }}
                  />
                </div>
                <p className="text-[13px] w-8 text-right shrink-0">
                  {sensorOk != null 
                    ? (sensorOk ? 'OK' : 'FAIL') 
                    : '—'}
                </p>
              </div>

            </div>
          </div>

          

        </DialogContent>
      </Dialog>
    
    </>
  )
}

