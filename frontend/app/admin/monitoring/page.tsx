"use client"

import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"

// icons
import { RadioTower, Activity, TriangleAlert, Waves, Map, X, Siren  } from "lucide-react"

// shadcn
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchFilter } from '@/components/SearchFilter'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// component
import AgosMapWrapper from "@/components/Map/AgosMapWrapper"

// lib
import { getConditionClass, ALERT_STYLE } from "@/lib/constant"
import { fetchWithAuth } from "@/lib/auth"

// table pagination
import { usePagination } from "@/components/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

// types
type Nodes = {
  node_id: number
  barangay_details: { barangay_id: number; barangay_name: string } | null
  hotspot_details: { hotspot_id: number; name: string; latitude: number; longitude: number } | null
  node_name: string
  availability_status: string
  status: string
  water_level: number | null
  water_flow_rate: number | null
  clog_pct: number | null
  condition: string
}

type Alert = {
  alert_id: number
  alert_type: string
  node_name: string | null
  barangay_name: string | null
  timestamp: string
  is_read: boolean
  alert_context?: Record<string, any> 
}

type DialogState = {
  open: boolean;
  node?: Nodes | null;
};

const CONDITIONS = ["All", "Critical", "Warning", "Normal"]

// open maps redirect to google map
const openInGoogleMaps = (latitude: number, longitude: number) => {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    "_blank"
  );
};

const getClogPctColor = (value: number) => {
  if (value < 34) return 'text-[#2C7B3C]' 
  if (value < 67) return 'text-[#E4B600]'
  return 'text-[#D81010]'
}

const ALERT_ICONS: Record<string, JSX.Element> = {
  Water_Level_Rising: <Activity size={18} />,
  Critical_Clog:      <RadioTower size={18} />,
  Node_Offline:       <TriangleAlert size={18} />,
  Low_Battery:        <TriangleAlert size={18} />,
  Weak_Signal:        <Activity size={18} />,
  Sensor_Failure:     <RadioTower size={18} />,
}

function getFilteredNode(nodes: Nodes[], condition: string, search: string) {
  const q = search.toLowerCase()
  return nodes
    .filter(b => b.hotspot_details != null)
    .filter(b => b.availability_status === 'Occupied')
    .filter(b => condition === "All" || b.condition === condition)
    .filter(b =>
      [b.node_name, b.barangay_details?.barangay_name]
        .some(field => field?.toLowerCase().includes(q))
    )
    .sort((a, b) => b.node_id - a.node_id)
}

export default function Monitoring() {
  const router = useRouter()

  // dialog state
  const [viewMapDialog, setViewMapDialog] = useState<DialogState>({
    open: false,
    node: null,
  })

  // date and time state
  const [dateTime, setDateTime]   = useState<Date | null>(null)

  // table state
  const [nodes, setNodes] = useState<Nodes[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  // filter state
  const [search, setSearch] = useState('')
  const [condition, setCondition] = useState("All")

  // dialog alert state
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [alertDialog, setAlertDialog] = useState(false)

  const filtered = getFilteredNode(nodes, condition, search)
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)

  // summary cards
  const occupiedNodes = nodes
    .filter(n => n.hotspot_details != null)
    .filter(n => n.availability_status === 'Occupied')

  const total    = occupiedNodes.length
  const critical = occupiedNodes.filter(n => n.condition === 'Critical').length
  const warning  = occupiedNodes.filter(n => n.condition === 'Warning').length
  const normal   = occupiedNodes.filter(n => n.condition === 'Normal').length

  // clock
  useEffect(() => {
    setDateTime(new Date())
    const interval = setInterval(() => setDateTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // fetch nodes + alerts
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setFetchError(false)

        const [nodesRes, alertsRes] = await Promise.all([
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`),
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/`),
        ])

        if (!nodesRes.ok || !alertsRes.ok) throw new Error()

        const nodesData  = await nodesRes.json()
        const alertsData = await alertsRes.json()

        setNodes(nodesData.results ?? nodesData)
        setAlerts(alertsData.results ?? alertsData)
      } catch {
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const todayAlerts = alerts.filter(alert => {
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

        {/* title and date/time */}
        <div className='flex justify-between'>
          <p className='font-bold text-[#122A48] text-lg'>Live Feed</p>
          <div className='flex gap-3 text-[#727272] text-sm items-center'>
            <p>{dateTime?.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            |
            <p>{dateTime?.toLocaleTimeString()}</p>
            <span className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#B2FBC173] text-[#2C7B3C]'>
              <span className='w-1.5 h-1.5 rounded-full bg-[#1D8104]'/>
              LIVE
            </span>
          </div>
        </div>

        {/* summary cards */}
        <div className="flex justify-between w-full text-[#122A48] mt-3">
          {[
            { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: total,    label: "Total Occupied Nodes" },
            { icon: <Activity   size={20} color="#D81010" />, bg: "bg-[#FFE5E5]", count: critical,  label: "Critical Events" },
            { icon: <TriangleAlert size={20} color="#FF9705" />, bg: "bg-[#F4E4A7]", count: warning, label: "Warning"   },
            { icon: <Waves      size={20} color="#1868A9" />, bg: "bg-[#1868A929]", count: normal,  label: "Normal"  },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-20 w-75 flex items-center p-6 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{card.count}</span>
                <p className="text-sm">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* body */}
        <div className='flex gap-4 mt-3 h-120'>

          {/* table */}
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-205 rounded-lg flex flex-col'>
            {/* filters */}
            <div className='flex gap-3 items-center p-4'>
              <SearchFilter value={search} onChange={setSearch} placeholder='Search sensor node or barangay...' width='w-95' />
              {CONDITIONS.map(c => (
                <Button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`cursor-pointer rounded-full border px-5 py-2 text-sm font-medium transition-colors
                    ${condition === c
                      ? "bg-[#1565BC] hover:bg-[#135aa6] text-white"
                      : "bg-transparent text-[#122A48] border-[#C6C6C8] hover:bg-[#c3dffe]"
                    }`}
                >
                  {c}
                </Button>
              ))}
            </div>

            <div className='px-4'>
              <p className='font-bold text-[#122A48] mb-3 -mt-1'>Canal Sensor Nodes</p>
            </div>

            <Table>
              <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC]'>
                <TableRow>
                  <TableHead className='font-semibold text-center text-[#727272]'>NODE ID</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>BARANGAY</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>LOCATION</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>WATER LEVEL</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>FLOW RATE</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>CLOG</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>CONDITION</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {fetchError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-[#D81010] font-semibold">Failed to load node devices. Please try again later.</p>
                        <Button
                          onClick={() => window.location.reload()}
                          className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                        >
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <RadioTower size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No sensor nodes found</p>
                        <p className="text-[#727272] text-sm text-center">
                          No sensor nodes match your search or filter. <br /> Try adjusting the filters above.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map(node => (
                    <TableRow key={node.node_id} className='font-medium text-[#122A48]'>
                      <TableCell className='text-center h-14'>{node.node_id}</TableCell>
                      <TableCell className='text-center'>{node.barangay_details?.barangay_name ?? "—"}</TableCell>
                      <TableCell className='text-center'>
                        <Button
                          onClick={() => setViewMapDialog({ open: true, node: node })}
                          className="text-[13px] rounded-lg text-[#2C7B3C] border border-[#C6C6C8] bg-[#B2FBC173] cursor-pointer hover:bg-[#78ee9073] py-2.5 px-2"
                        >
                         <Map size={16}/>
                          View on map
                        </Button>
                      </TableCell>
                      <TableCell className='text-center'>{node.water_level != null ? `${node.water_level} cm` : "—"}</TableCell>
                      <TableCell className='text-center'>
                        {node.water_flow_rate != null ? `${Number(node.water_flow_rate).toFixed(5)} m/s` : "—"}
                        
                      </TableCell>
                      <TableCell className={`text-center ${node.clog_pct != null ? getClogPctColor(node.clog_pct) : ''}`}>{node.clog_pct != null ? `${node.clog_pct} %` : "—"}</TableCell>
                      <TableCell className={`text-center font-semibold ${getConditionClass(node.condition)}`}>{node.condition ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className='mt-auto'>
              <TablePagination
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          {/* live alerts */}
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-67 rounded-lg flex flex-col'>
            <div className='flex justify-between items-center justify-between p-2 px-3'>
              <p className='font-semibold text-[#122A48]'>Live Alerts</p>
            </div>
            <hr className='border-[#C6C6C8]' />
            <div className='flex flex-col gap-2 p-3 overflow-y-auto'>
              {todayAlerts.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full py-43 gap-2'>
                  <Siren size={28} color="#C6C6C8" />
                  <p className='text-xs text-[#727272] text-center'>No alerts today</p>
                </div>
              ) : (
                todayAlerts.slice(0, 6).map(alert => {
                  const style = ALERT_STYLE[alert.alert_type] ?? ALERT_STYLE.default
                  return (
                    <div
                      key={alert.alert_id}
                      onClick={() => {
                        setSelectedAlert(alert)
                        setAlertDialog(true)
                      }}
                      className={`flex items-center gap-3 p-1 h-14 rounded-lg border cursor-pointer hover:opacity-80 ${style.border} ${style.shadow} ${alert.is_read ? 'opacity-60' : 'bg-white'}`}
                    >
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

          {/* device and clog level legend */}
          <div className='flex flex-col gap-3'>
            {/* device status */}
            {/* <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-57 h-60 rounded-lg flex flex-col'>
              <div className='p-3 flex flex-col gap-2 '>
                <p className='font-semibold text-[#122A48]'>Device Status</p>
                <hr />
              </div>
              <div className='flex flex-col'>
                {[
                  { color: 'text-[#2C7B3C]', dotColor: 'bg-[#2C7B3C]', count: activeCount,    label: "Active" },
                  { color: 'text-[#727272]', dotColor: 'bg-[#727272]', count: inactiveCount,  label: "Inactive" },
                  { color: 'text-[#582579]', dotColor: 'bg-[#582579]', count: maintenanceCount, label: "Maintenance" },
                ].map(status => (
                  <div key={status.label} className="flex justify-between items-center py-3.5 px-3 bg-[#FAFCFD] -mt-2">
                    <div className="flex gap-3 items-center">
                      <span className={`w-2 h-2 rounded-full ${status.dotColor} `}/>
                      <p className={`text-sm font-semibold ${status.color}`}>{status.label}</p>
                    </div>
                    <span className={`text-sm font-bold leading-tight ${status.color}`}>{status.count}</span>
                  </div>
                ))}

                <div className='p-3 -mt-2'>
                  <hr />
                  <div className='flex justify-between mt-2 font-semibold text-[#122A48]'>
                    <p>Total</p>
                    <span>{nodes.length}</span>
                  </div>
                </div>

              </div>
            </div> */}

            {/* clog level legend */}
            <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-47 h-40 rounded-lg flex flex-col'>
              <div className='p-3 flex flex-col gap-2 '>
                <p className='font-semibold text-[#122A48]'>Clog Level Legend</p>
                <hr />
              </div>
              <div className='flex flex-col'>
                {[
                  { color: 'text-[#D81010]', dotColor: 'bg-[#D81010]', percent: "67-100%", label: "High" },
                  { color: 'text-[#E4B600]', dotColor: 'bg-[#E4B600]', percent: '34-66%',  label: "Moderate" },
                  { color: 'text-[#2C7B3C]', dotColor: 'bg-[#2C7B3C]', percent: '0-33%', label: "Low" },
                ].map(status => (
                  <div key={status.label} className="flex justify-between items-center py-3 px-3 bg-[#FAFCFD] -mt-2">
                    <div className="flex gap-3 items-center">
                      <span className={`w-2 h-2 rounded-full ${status.dotColor} `}/>
                      <p className={`text-xs font-semibold ${status.color}`}>{status.label}</p>
                    </div>
                    <span className={`text-xs font-medium leading-tight ${status.color}`}>{status.percent}</span>
                  </div>
                ))}

              </div>
            </div>


          </div>

        </div>
      </div>

      {/* Dialog */}
      {/* View on Map Dialog */}
      <Dialog open={viewMapDialog.open}>
        <DialogContent className="[&>button]:hidden p-4 md:p-6 text-[#122A48] rounded-lg border border-[#C6C6C8] min-w-80 md:min-w-150">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <p className="font-bold text-base md:text-lg">{viewMapDialog.node?.node_name}</p>
              </div>
              <button className="cursor-pointer" onClick={() => setViewMapDialog({ open: false, node: null })}>
                <X size={18} />
              </button>
            </div>
          </DialogHeader>
          {/* hiddent title to remove error */}
          <DialogTitle className="sr-only">
            Map
          </DialogTitle>
          <div className="h-100 md:h-[380px] rounded-b-lg w-70 md:w-140 overflow-hidden">
            <AgosMapWrapper
              markers={nodes
                .filter(n => n.hotspot_details?.latitude != null && n.hotspot_details?.longitude != null)
                .map(n => ({
                  latitude:  n.hotspot_details!.latitude,
                  longitude: n.hotspot_details!.longitude,
                  label:     n.node_name,
                  condition: n.condition,
                  sublabel:  `Water: ${n.water_level ?? "—"}cm | Clog: ${n.clog_pct ?? "—"}%`,
                }))}
              zoom={13}
            />
          </div>
          <div className="border-t border-[#C6C6C8] flex justify-between py-3 -mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <p className="text-xs md:text-sm">{viewMapDialog.node?.hotspot_details?.latitude}</p>
              <p className="text-xs md:text-sm">{viewMapDialog.node?.hotspot_details?.longitude}</p>
            </div>
            <Button 
              disabled={
                viewMapDialog.node?.hotspot_details?.latitude == null ||
                viewMapDialog.node?.hotspot_details?.longitude == null
              }
              onClick={() => {
                const node = viewMapDialog.node;
                if (!node?.hotspot_details) return;

                openInGoogleMaps(
                  node.hotspot_details.latitude,
                  node.hotspot_details.longitude
                );
              }}
              className="cursor-pointer rounded-lg border border-[#C6C6C8] bg-[#FAFCFD] hover:bg-[#d6e4eb] px-3 py-2 md:px-4 md:py-3 text-[#727272]"
            >
              <Map />
              Open in Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Detail Dialog */}
      <Dialog open={alertDialog} onOpenChange={setAlertDialog}>
        <DialogContent className="[&>button]:hidden text-[#122A48] w-[350px]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${ALERT_STYLE[selectedAlert?.alert_type ?? '']?.icon ?? ALERT_STYLE.default.icon}`}>
                  {ALERT_ICONS[selectedAlert?.alert_type ?? ''] ?? <Activity size={16} />}
                </div>
                <p className="font-bold text-sm">
                  {selectedAlert?.alert_type.replace(/_/g, ' ')}
                </p>
              </div>
              <button onClick={() => setAlertDialog(false)} className="cursor-pointer">
                <X size={16} />
              </button>
            </div>
          </DialogHeader>

          <DialogTitle className="sr-only">Alert Details</DialogTitle>
          <hr />

          {selectedAlert && (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <p className="text-[#727272]">Node</p>
                <p className="font-medium">{selectedAlert.node_name ?? '—'}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-[#727272]">Barangay</p>
                <p className="font-medium">{selectedAlert.barangay_name ?? '—'}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-[#727272]">Detected</p>
                <p className="font-medium">
                  {new Date(selectedAlert.timestamp).toLocaleString('en-PH', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                  })}
                </p>
              </div>

              {selectedAlert.alert_context && Object.keys(selectedAlert.alert_context).length > 0 && (
                <>
                  <hr />
                  <p className="font-semibold text-xs text-[#727272]">DETAILS</p>
                  {Object.entries(selectedAlert.alert_context).map(([key, value]) => {
                    let displayValue: string = String(value)

                    if (typeof value === 'boolean') {
                      displayValue = value ? 'Connected' : 'Disconnected'
                    } else if (key === 'water_level') {
                      displayValue = `${value} cm`
                    } else if (key === 'water_flow_rate') {
                      displayValue = `${Number(value).toFixed(5)} m/s`
                    } else if (key.endsWith('_pct') || key === 'confidence') {
                      displayValue = `${Number(value).toFixed(1)}%`
                    } else if (key === 'estimated_volume') {
                      displayValue = `${value} kg`
                    } else if (key === 'battery_voltage') {
                      displayValue = `${Number(value).toFixed(2)} V`
                    } else if (key === 'signal_strength') {
                      displayValue = `${value} dBm`
                    }

                    return (
                      <div key={key} className="flex justify-between">
                        <p className="text-[#727272] capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="font-medium">{displayValue}</p>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}