"use client"

// react
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// icons
import { RadioTower, Droplets, TriangleAlert, MapPinned, Siren, Activity, Battery, Signal, ScanSearch } from "lucide-react"

// components
import AgosMapWrapper from "@/components/Map/AgosMapWrapper"
import ReportProgressBar from "@/components/MonthlyReportProgressBar"
import { ALERT_STYLE } from '@/lib/constant'

const ALERT_ICONS: Record<string, JSX.Element> = {
  Water_Level_Rising: <Activity size={18} />,
  Critical_Clog:      <RadioTower size={18} />,
  Node_Offline:       <TriangleAlert size={18} />,
  Low_Battery:        <TriangleAlert size={18} />,
  Weak_Signal:        <Activity size={18} />,
  Sensor_Failure:     <RadioTower size={18} />,
}

// auth
import { fetchWithAuth } from "@/lib/auth"

// shadcn
import { Button } from "@/components/ui/button"

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
}

type ClogEvents = {
  event_id: number
  severity: string
}

type Barangay = {
  barangay_id: number
  barangay_name: string
  latitude: number
  longitude: number
  is_registered: boolean
}

type Alert = {
  alert_id: number
  alert_type: string
  node_name: string | null
  barangay_name: string | null
  timestamp: string
  is_read: boolean
}

type MonthlyReports = {
  monthly_report_id: number
  report_month: string
  entry_date: number
  submitted_by: string
  verified_by: string
  submitted_at: string
  status: string
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

// helpers
function getBatteryPct(voltage: number) {
  const min = 3.0, max = 4.2
  return Math.min(100, Math.max(0, Math.round(((voltage - min) / (max - min)) * 100)))
}

function getSignalPct(dbm: number) {
  const min = -110, max = -50
  return Math.min(100, Math.max(0, Math.round(((dbm - min) / (max - min)) * 100)))
}

function getSignalLabel(dbm: number) {
  if (dbm >= -70) return "Good signal"
  if (dbm >= -85) return "Marginal signal"
  if (dbm >= -100) return "Weak signal"
  return "No signal"
}

function getBarColor(pct: number) {
  if (pct >= 60) return "#4ADE80"
  if (pct >= 30) return "#F5C518"
  return "#F87171"
}

function getDotColor(pct: number) {
  if (pct >= 60) return "bg-green-400"
  if (pct >= 30) return "bg-yellow-400"
  return "bg-red-400"
}


export default function Dashboard() {
  const router = useRouter()

  // us
  const [allSensorNodes, setAllSensorNodes] = useState<SensorNodes[]>([])
  const [allClogEvents, setAllClogEvents] = useState<ClogEvents[]>([])
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([])
  const [allAlerts, setAllAlerts] = useState<Alert[]>([])
  const [allMonthlyReports, setAllMonthlyReports] = useState<MonthlyReports[]>([])
  const [allNodeHealth, setAllNodeHealth] = useState<NodeHealth[]>([])

  // summary cards
  const totalSensorNodes = allSensorNodes.length
  const criticalAlerts = allClogEvents.filter(b => b.severity === 'High').length
  const registeredBarangay = allBarangays.filter(b => b.is_registered).length
  const resolvedClog = allBarangays.filter(b => !b.is_registered).length

  // health helpers
  const activeHealth = allNodeHealth.filter(n => n.node_details.status === "Active")

  const voltages = activeHealth.map(n => n.battery_voltage).filter((v): v is number => v != null)
  const signals  = activeHealth.map(n => n.signal_strength).filter((v): v is number => v != null)
  const continuityList = activeHealth.map(n => n.sensor_continuity).filter((v): v is boolean => v != null)

  const avgVoltage   = voltages.length   ? voltages.reduce((a, b) => a + b, 0) / voltages.length   : null
  const avgSignal    = signals.length    ? signals.reduce((a, b) => a + b, 0) / signals.length     : null
  const passingCount = continuityList.filter(Boolean).length
  const allPassing = continuityList.length
    ? (passingCount / continuityList.length) >= 0.5
    : null

  const batteryPct = avgVoltage != null ? getBatteryPct(avgVoltage) : null
  const signalPct  = avgSignal  != null ? getSignalPct(avgSignal)   : null

  // fetch of data
  const fetchSensorNodes = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllSensorNodes(data.results ?? data)
    } catch {}
  }

  useEffect(() => {
    fetchSensorNodes()
  }, [])

  const fetchMonthlyReports = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangay-reports/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllMonthlyReports(data.results ?? data)
    } catch {}
  }

  useEffect(() => {
    fetchMonthlyReports()
  }, [])

  const fetchAlerts = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`)
      if (!res.ok) throw new Error()
        const data = await res.json()
      setAllAlerts(data.results ?? data)
    } catch {}
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchNodeHealth = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/system-health/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllNodeHealth(data.results ?? data)
    } catch {}
  }

  useEffect(() => {
    fetchNodeHealth()
  }, [])

  const todayAlerts = allAlerts.filter(alert => {
    const alertDate = new Date(alert.timestamp)
    const today = new Date()
    return (
      alertDate.getFullYear() === today.getFullYear() &&
      alertDate.getMonth() === today.getMonth() &&
      alertDate.getDate() === today.getDate()
    )
  })

  console.log(allNodeHealth)


  return (
    <>
      <div className="hidden md:flex flex-col">
        
        {/* title */}
        <div className="flex w-full mb-2">
          <p className="text-[#122A48] font-bold text-[15px]">System Summary</p>
        </div>

        {/* total cards */}
        <div className="flex justify-between w-full text-[#122A48]">
          {[
            { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: totalSensorNodes, label: "Total Sensor Nodes" },
            { icon: <TriangleAlert size={20} color="#D81010" />, bg: "bg-[#FFE5E5]", count: criticalAlerts, label: "Critical Clogs" },
            { icon: <MapPinned   size={20} color="#1f518f" />, bg: "bg-[#CDE3DE]", count: registeredBarangay, label: "Registered Barangay" },
            { icon: <Droplets size={20} color="#1565BC" />, bg: "bg-[#1565BC29]", count: resolvedClog, label: "Resolved this Month" },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-17 w-75 flex items-center p-3 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#122A48] leading-tight">{card.count}</span>
                <p className="text-xs text-[#122A48]">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* map, monthly report, alerts */}
        <div className="text-[#122A48] mt-3 flex gap-2 w-full">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {/* map */}
            <div className="bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg h-[400px] flex flex-col">
              <div className="px-2 pt-2 pb-1">
                <p className="font-bold text-sm">Canal Network Map - Rosario, La Union</p>
              </div>
              <div className="flex-1 overflow-hidden rounded-b-lg">
                <AgosMapWrapper
                  markers={allSensorNodes.map(n => ({
                    latitude:  n.latitude,
                    longitude: n.longitude,
                    label:     n.node_name,
                    condition: n.health_status ?? 'Normal',
                    sublabel: `Node Status: ${n.health_status ?? 'Normal'}`,
                  }))}
                  zoom={13}
                  colorMode="health"
                />
              </div>
            </div>

            {/* monthly report progress */}
            <div>
              <ReportProgressBar
                reports={allMonthlyReports}
                month="May 2026"
              />
            </div>
          </div>

          {/* alerts */}
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-67 rounded-lg flex flex-col'>
            <div className='flex justify-between items-center justify-between p-3'>
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
                <div className='flex flex-col items-center justify-center h-full py-37 gap-2'>
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

        {/* sensor node health summary */}
        <>
          <div className="bg-[#FAFCFD] rounded-lg border border-[#00000040] text-[#122A48] mt-2 p-3">
            <div className="mb-2">
              <p className="font-semibold text-sm">Sensor Node Health Summary</p>
              <p className="text-[12px] text-[#727272]">Average across all active sensor nodes</p>
            </div>

            <div className="flex gap-3">

              {/* Battery Voltage */}
              <div className="border border-[#C6C6C8] rounded-lg p-3 text-[#122A48] flex-1 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-2 items-center">
                    <Battery size={15} />
                    <p className="font-bold text-xs">Avg. Battery Voltage</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${batteryPct != null ? getDotColor(batteryPct) : 'bg-[#C6C6C8]'}`} />
                </div>
                <p className="text-2xl font-bold mt-1">{avgVoltage != null ? avgVoltage.toFixed(1) : '—'}</p>
                <p className="text-xs text-[#727272] mb-2">Volts</p>
                <div className="w-full bg-[#E5E5E6] rounded-full h-1.5">
                  {batteryPct != null && (
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${batteryPct}%`, backgroundColor: getBarColor(batteryPct) }} />
                  )}
                </div>
                <p className="text-[10px] text-[#727272] mt-1">
                  {batteryPct != null ? `${batteryPct}% avg. capacity across sensor nodes` : 'No data'}
                </p>
              </div>

              {/* 4G Signal */}
              <div className="border border-[#C6C6C8] rounded-lg p-3 text-[#122A48] flex-1 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-2 items-center">
                    <Signal size={15} />
                    <p className="font-bold text-xs">Avg. 4G Signal</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${signalPct != null ? getDotColor(signalPct) : 'bg-[#C6C6C8]'}`} />
                </div>
                <p className="text-2xl font-bold mt-1">{avgSignal != null ? avgSignal.toFixed(0) : '—'}</p>
                <p className="text-xs text-[#727272] mb-2">dBm</p>
                <div className="w-full bg-[#E5E5E6] rounded-full h-1.5">
                  {signalPct != null && (
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${signalPct}%`, backgroundColor: getBarColor(signalPct) }} />
                  )}
                </div>
                <p className="text-[10px] text-[#727272] mt-1">
                  {avgSignal != null ? getSignalLabel(avgSignal) : 'No data'}
                </p>
              </div>

              {/* Sensor Continuity */}
              <div className="border border-[#C6C6C8] rounded-lg p-3 text-[#122A48] flex-1 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-2 items-center">
                    <ScanSearch size={15} />
                    <p className="font-bold text-xs">Sensor Continuity</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${allPassing == null ? 'bg-[#C6C6C8]' : allPassing ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
                <p className="text-2xl font-bold mt-1">
                  {allPassing == null ? '—' : allPassing ? 'OK' : 'FAIL'}
                </p>
                <p className="text-xs text-[#727272] mb-2">Continuity</p>
                <div className="w-full bg-[#E5E5E6] rounded-full h-1.5">
                  {continuityList.length > 0 && (
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${(passingCount / continuityList.length) * 100}%`,
                        backgroundColor: allPassing ? '#4ADE80' : '#F87171'
                      }} />
                  )}
                </div>
                <p className="text-[10px] text-[#727272] mt-1">
                  {continuityList.length === 0
                    ? 'No data'
                    : `${passingCount} of ${continuityList.length} sensors passing continuity`}
                </p>
              </div>

            </div>
          </div>
        </>

        



      </div>
    </>
  )
 }
