"use client"

// icons
import { BatteryMedium, Signal, ScanSearch, Radar, FileSearch, Battery, FileDown  } from "lucide-react";

// react
import { useEffect, useState } from "react";

// components
import AgosMapWrapper from "@/components/Map/AgosMapWrapper";
import { HealthSkeleton } from "@/components/Skeleton/Admin/HealthSkeleton";
import { Button } from "@/components/ui/button"
import { useExportDialog } from "@/components/ExportDialog/useExportDialog";
import { exportPdf } from "@/lib/exportPDF";
import { useToast } from "@/components/hooks/useToast";
import { Toast } from "@/components/Toast";

// auth
import { fetchWithAuth } from "@/lib/auth";


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

type SensorNode = {
  node_id: number
  node_name: string
  latitude: number
  longitude: number
  status: string
  health_status: string | null
}

type HealthAlerts = {
  alert_id: number
  alert_type: 'Low_Battery' | 'Weak_Signal' | 'Sensor_Failure' | 'Node_Offline'
  timestamp: string
  node: {
    node_id: number
    node_name: string
    barangay_details: {
      barangay_name: string
    }
  } | null
  health_log: {
    health_id: number
    battery_voltage?: number
    signal_strength?: number
    sensor_continuity?: boolean
    status?: string
  } | null
}

function getBarColor(pct: number) {
  if (pct >= 60) return '#6AE783D6'
  if (pct >= 30) return '#E9C180' 
  return '#F87171'
}

function getDotColor(pct: number) {
  if (pct >= 60) return 'bg-green-500'
  if (pct >= 30) return 'bg-yellow-400'
  return 'bg-red-500'
}

function getBatteryPct(voltage: number) {
  const pct = ((voltage - 3.0) / (4.2 - 3.0)) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

function getSignalPct(dbm: number) {
  const pct = ((dbm + 100) / 50) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

function getSignalLabel(dbm: number) {
  if (dbm > -70) return 'Good signal strength'
  if (dbm > -90) return 'Marginal, check antenna'
  return 'Poor signal, check antenna'
}

function getMicrocontrollerStatus(status?: string) {
  if (status === 'Critical') return 'Critical Fault'
  if (status === 'Warning') return 'Needs Attention'
  if (status === 'Normal') return 'Operating Normally'
  return '—'
}

function getWaterSensorStatus(sensor_continuity?: boolean) {
  if (sensor_continuity == null) return '—'
  return sensor_continuity ? 'Distance Reading OK' : 'No Echo Detected'
}

function getPowerStorageStatus(battery_voltage?: number) {
  if (battery_voltage == null) return '—'
  return `${getBatteryPct(battery_voltage)}% Capacity`
}

function getPMUStatus(battery_voltage?: number) {
  if (battery_voltage == null) return '—'
  const pct = getBatteryPct(battery_voltage)
  if (pct >= 60) return 'Stable'
  if (pct >= 30) return 'Monitor'
  return 'Low Power'
}


export default function Health() {
  const { toasts, addToast, removeToast } = useToast()

  // node data states
  const [allNodes, setAllNodes] = useState<SensorNode[]>([])
  const [healthAlert, setHealthAlert] = useState<HealthAlerts[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)
  const [selectedNode, setSelectedNode] = useState<NodeHealth | null>(null)
  const [healthLogs, setHealthLogs] = useState<NodeHealth[]>([])

  const emptyStateText = selectedNodeId === null ? 'No node selected' : 'No health data yet'
  
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  // summary cards — derived from the latest health log per node (this month)
  const totalOnline = allNodes.filter(n => n.status === 'Active').length

  const latestHealthByNode = new Map<number, NodeHealth>()
  for (const log of healthLogs) {
    if (!latestHealthByNode.has(log.node_details.node_id)) {
      latestHealthByNode.set(log.node_details.node_id, log)
    }
  }
  const latestLogs = Array.from(latestHealthByNode.values())

  const batteryReadings = latestLogs.filter(l => l.battery_voltage != null).map(l => l.battery_voltage!)
  const avg_battery = batteryReadings.length
    ? (batteryReadings.reduce((a, b) => a + b, 0) / batteryReadings.length).toFixed(1)
    : '—'

  const signalReadings = latestLogs.filter(l => l.signal_strength != null).map(l => l.signal_strength!)
  const avg_signal = signalReadings.length
    ? Math.round(signalReadings.reduce((a, b) => a + b, 0) / signalReadings.length)
    : '—'

  const sensorFailing = latestLogs.filter(l => l.sensor_continuity === false).length

  const fetchNodes = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllNodes(data.results ?? data)
    } catch {}
  }

  useEffect(() => {
    fetchNodes()
  }, [])

  const fetchHealthLogs = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/system-health/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setHealthLogs(data.results ?? data)
    } catch {}
  }

  useEffect(() => {
    fetchHealthLogs()
  }, [])  

  const fetchAlerts = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/alerts/?alert_type=Low_Battery,Weak_Signal,Sensor_Failure,Node_Offline&page_size=3`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
    setHealthAlert(data.results ?? data)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  // handlers
  const handleSelectNode = async (nodeId: number) => {
    setSelectedNodeId(nodeId)
    setSelectedNode(null)
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/system-health/node/${nodeId}/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const logs = data.results ?? data
      setSelectedNode(logs[0] ?? null)
    } catch {
      setSelectedNode(null)
    }
  }

  const { requestExport, ExportDialogs } = useExportDialog(async () => {
    try {
      await exportPdf(
        "/api/system-health/export/",
        {},
        "system-health.pdf"
      )
    } catch {
      addToast("Failed to export system health.", "error")
    }
  }, { description: "Are you sure you want to export the current system health summary as a PDF?" })

  if (loading) return <HealthSkeleton/>

   return (
     <>
      <div className="hidden md:flex md:flex-col md:h-full">

        {/* title */}
        <div className="flex w-full mb-2 justify-between items-center">
          <p className="text-[#122A48] font-bold text-[15px]">Sensor Nodes Health</p>

          <Button onClick={() => requestExport()} className="bg-[#2fd45b] hover:bg-[#28b54e] cursor-pointer">
            <FileDown size={16} className="mr-1" />
            Export PDF
          </Button>
        </div>
        
        {/* header cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full text-[#122A48]">
          {[
            { icon: <Radar size={17} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: totalOnline, label: "Online Nodes" },
            { icon: <BatteryMedium size={17} color="#E4B600" />, bg: "bg-[#F0FBB2]", count: avg_battery === '—' ? '—' : `${avg_battery}V`, label: "Average Battery" },
            { icon: <Signal size={17} color="#582579" />, bg: "bg-[#E5EAFF]", count: avg_signal === '—' ? '—' : `${avg_signal} dBm`, label: "Average Signal" },
            { icon: <ScanSearch size={17} color="#D81010" />, bg: "bg-[#D8101059]", count: sensorFailing, label: "Sensors Failing" },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-17 min-[2560px]:h-20 min-[3840px]:h-24 w-full flex items-center p-6 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight">{card.count}</span>
                <p className="text-xs">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* map and preview node */}
        <div className="flex gap-3 mt-2 flex-1 min-h-0">
          {/* map */}
          <div className="rounded-lg bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] p-3 border border-[#C9C9C9] flex-[3] min-w-0 h-full flex flex-col">
              <p className="text-[#122A48] font-bold mb-1">Canal Network Map - Rosario, La Union</p>
            <div className="flex-1 rounded-lg overflow-hidden">
              <AgosMapWrapper
                markers={allNodes
                  .filter(n => n.latitude != null && n.longitude != null)
                  .map(n => ({
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

          {/* preview node */}
          <div className="rounded-lg bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] flex-1 min-w-[240px]">
            {selectedNodeId === null ? (
              <div className="flex justify-center items-center h-full flex-col gap-2 border border-[#C9C9C9] w-full rounded-lg">
                <FileSearch size={50} className="text-[#1565BC80]"/>
                <p className="font-semibold text-[#122A488F]">No node selected</p>
                <p className="text-[#122A4873] text-xs text-center">Select a node from the network <br /> map to view its hardware status <br /> and sensor information</p>
              </div>
            ) : !selectedNode ? (
              <div className="flex justify-center items-center h-full flex-col gap-2 border border-[#C9C9C9] w-full rounded-lg">
                <Radar size={50} className="text-[#1565BC80]"/>
                <p className="font-semibold text-[#122A488F]">No health data yet</p>
                <p className="text-[#122A4873] text-xs text-center">
                  {allNodes.find(n => n.node_id === selectedNodeId)?.node_name ?? 'This node'} hasn't reported <br /> any hardware status yet
                </p>
              </div>
            ) : (
             <div className="flex flex-col text-[#122A48] w-full">
                {/* Hardware details */}
                <div className="w-full p-3 -mb-4">
                  <p className="font-semibold">Hardware Details</p>
                </div>
                <div className="bg-[#58D07159] rounded px-3 py-2 text-[#2C7B3C] m-3 w-40 -mb-2">
                  <p className="text-xs">{selectedNode.node_details.node_name} - {selectedNode.node_details.barangay_details.barangay_name}</p>
                </div>
                <div className="flex justify-between text-xs p-3 items-center">
                  <p>🌙 {selectedNode.node_details.status === 'Inactive' ? 'Deep Sleep' : 'Online'}</p>
                  <div className="bg-[#58D07159] rounded border border-[#2C7B3C] text-[#2C7B3C] px-4 py-1">
                    <p>{selectedNode.node_details.status}</p>
                  </div>
                </div>

                <hr />

                {/* device information */}
                <div className="flex flex-col gap-1.5 p-3">
                  <div className="w-full mb-1">
                    <p className="font-semibold">Device Information</p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <p>Device ID</p>
                    <p></p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <p>Model</p>
                    <p></p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <p>Firmware</p>
                    <p></p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <p>Uptime</p>
                    <p></p>
                  </div>
                </div>

                <hr />

                {/* Sensor and modules */}
                <div className="flex flex-col gap-1.5 p-3">
                  <div className="flex justify-between items-center text-xs">
                    <p>Microcontroller</p>
                    <p className="text-[#727272] text-[10px]">{getMicrocontrollerStatus(selectedNode.status)}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <p>Water-level sensor</p>
                    <p className="text-[#727272] text-[10px]">{getWaterSensorStatus(selectedNode.sensor_continuity)}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <p>Power Storage Reservoir</p>
                    <p className="text-[#727272] text-[10px]">{getPowerStorageStatus(selectedNode.battery_voltage)}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <p>Power Management Unit</p>
                    <p className="text-[#727272] text-[10px]">{getPMUStatus(selectedNode.battery_voltage)}</p>
                  </div>
                </div>  

             </div>
            )}
          </div>
        </div>
        
        {/* node health cards */}
        <div className="grid grid-cols-3 gap-3 mt-2 w-full min-h-[130px]">

          {/* Battery Voltage */}
          <div className="border border-[#C6C6C8] rounded-lg p-3 min-[2560px]:p-4 min-[3840px]:p-5 text-[#122A48] w-full bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            
            <div className="flex justify-between items-center mb-1">
              <div className="flex gap-2 items-center">
                <Battery size={20} />
                <p className="font-bold text-sm">Battery Voltage</p>
              </div>
              {(() => {
                if (selectedNode?.battery_voltage == null) return <span className="w-2 h-2 rounded-full bg-[#C6C6C8]" />
                const pct = getBatteryPct(selectedNode.battery_voltage)
                return <span className={`w-2 h-2 rounded-full ${getDotColor(pct)}`} />
              })()}
            </div>

            {/* empty state vs data */}
            {!selectedNode ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-xs text-[#727272]">{emptyStateText}</p>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold mt-1">
                  {selectedNode.battery_voltage?.toFixed(1) ?? '—'}
                </p>
                <p className="text-xs text-[#727272] mb-2">Volts</p>
                {selectedNode.battery_voltage != null ? (() => {
                  const pct = getBatteryPct(selectedNode.battery_voltage)
                  return (
                    <>
                      <div className="w-full bg-[#E5E5E6] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: getBarColor(pct) }} />
                      </div>
                      <p className="text-[10px] text-[#727272] mt-1">{pct}% Capacity</p>
                    </>
                  )
                })() : (
                  <>
                    <div className="w-full bg-[#E5E5E6] rounded-full h-1.5" />
                    <p className="text-[10px] text-[#727272] mt-1">— % Capacity</p>
                  </>
                )}
              </>
            )}

          </div>

          {/* 4G Signal */}
          <div className="border border-[#C6C6C8] rounded-lg p-3 min-[2560px]:p-4 min-[3840px]:p-5 text-[#122A48] w-full bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">

            <div className="flex justify-between items-center mb-1">
              <div className="flex gap-2 items-center">
                <Signal size={20} />
                <p className="font-bold text-sm">4G Signal</p>
              </div>
              {(() => {
                if (selectedNode?.signal_strength == null) return <span className="w-2 h-2 rounded-full bg-[#C6C6C8]" />
                const pct = getSignalPct(selectedNode.signal_strength)
                return <span className={`w-2 h-2 rounded-full ${getDotColor(pct)}`} />
              })()}
            </div>
            
            {!selectedNode ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-xs text-[#727272]">No node selected</p>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold mt-1">
                  {selectedNode?.signal_strength != null ? `${selectedNode.signal_strength}` : '—'}
                </p>
                <p className="text-xs text-[#727272] mb-2">
                  {selectedNode?.signal_strength != null ? 'dBm' : 'dBm'}
                </p>
                {selectedNode?.signal_strength != null ? (() => {
                  const pct = getSignalPct(selectedNode.signal_strength)
                  return (
                    <>
                      <div className="w-full bg-[#E5E5E6] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: getBarColor(pct) }} />
                      </div>
                      <p className="text-[10px] text-[#727272] mt-1">{getSignalLabel(selectedNode.signal_strength)}</p>
                    </>
                  )
                })() : (
                  <>
                    <div className="w-full bg-[#E5E5E6] rounded-full h-1.5" />
                    <p className="text-[10px] text-[#727272] mt-1">No data</p>
                  </>
                )} 
              </>
            )}
          </div>

          {/* Sensor Continuity */}
          <div className="border border-[#C6C6C8] rounded-lg p-3 min-[2560px]:p-4 min-[3840px]:p-5 text-[#122A48] w-full bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">

            <div className="flex justify-between items-center mb-1">
              <div className="flex gap-2 items-center">
                <ScanSearch size={20} />
                <p className="font-bold text-sm">Sensor</p>
              </div>
              {selectedNode?.sensor_continuity == null
                ? <span className="w-2 h-2 rounded-full bg-[#C6C6C8]" />
                : <span className={`w-2 h-2 rounded-full ${selectedNode.sensor_continuity ? 'bg-green-500' : 'bg-red-500'}`} />
              }
            </div>

            {!selectedNode ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-xs text-[#727272]">No node selected</p>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold mt-1">
                  {selectedNode?.sensor_continuity == null ? '—' : selectedNode.sensor_continuity ? 'OK' : 'FAIL'}
                </p>
                <p className="text-xs text-[#727272] mb-2">Continuity</p>
                <>
                  <div className="w-full bg-[#E5E5E6] rounded-full h-1.5">
                    {selectedNode?.sensor_continuity != null && (
                      <div className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: selectedNode.sensor_continuity ? '100%' : '15%',
                          backgroundColor: selectedNode.sensor_continuity ? '#4ADE80' : '#F87171'
                        }} />
                    )}
                  </div>
                  <p className="text-[10px] text-[#727272] mt-1">
                    {selectedNode?.sensor_continuity == null
                      ? 'No data'
                      : selectedNode.sensor_continuity
                        ? 'Node sensor passing'
                        : 'Node sensor failing'}
                  </p>
                </>
              </>
            )}
          </div>

        </div>      
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
      {ExportDialogs}
     </>
   )
 }