"use client"

import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"

// icons
import { RadioTower, Activity, TriangleAlert, Waves } from "lucide-react"

// shadcn
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchFilter } from '@/components/SearchFilter'

// lib
import { getConditionClass, getStatusClass, getDotClass, ALERT_STYLE } from "@/lib/constant"
import { getAuthHeaders } from "@/lib/auth"

// table pagination
import { usePagination } from "@/components/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

// types
type Nodes = {
  node_id: number
  barangay_details: { barangay_id: number; barangay_name: string } | null
  node_name: string
  latitude: number
  longitude: number
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
}

// constants
const CONDITIONS = ["All", "Overflow", "Warning", "Normal", "Inactive"]

const ALERT_ICONS: Record<string, JSX.Element> = {
  Overflow_Detected:  <Waves size={18} />,
  Water_Level_Rising: <Activity size={18} />,
  High_Clog_Index:    <RadioTower size={18} />,
  Node_Offline:       <TriangleAlert size={18} />,
  Low_Battery:        <TriangleAlert size={18} />,
  Weak_Signal:        <Activity size={18} />,
  Sensor_Failure:     <RadioTower size={18} />,
}

function getFilteredNode(nodes: Nodes[], condition: string, search: string) {
  const q = search.toLowerCase()
  return nodes
    .filter(b => condition === "All" || b.condition === condition)
    .filter(b =>
      [b.node_name, b.barangay_details?.barangay_name]
        .some(field => field?.toLowerCase().includes(q))
    )
    .sort((a, b) => b.node_id - a.node_id)
}

export default function Monitoring() {
  const router = useRouter()

  const [dateTime, setDateTime]   = useState<Date | null>(null)
  const [nodes, setNodes]         = useState<Nodes[]>([])
  const [alerts, setAlerts]       = useState<Alert[]>([])
  const [loading, setLoading]     = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [search, setSearch]       = useState('')
  const [condition, setCondition] = useState("All")

  const filtered = getFilteredNode(nodes, condition, search)
const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)

  // summary cards
  const total    = nodes.length
  const overflow = nodes.filter(n => n.condition === 'Overflow').length
  const warning  = nodes.filter(n => n.condition === 'Warning').length
  const normal   = nodes.filter(n => n.condition === 'Normal').length

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
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`, { headers: getAuthHeaders() }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/all/`, { headers: getAuthHeaders() }),
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
            { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: total,    label: "Total Sensor Nodes" },
            { icon: <Activity   size={20} color="#D81010" />, bg: "bg-[#FFE5E5]", count: overflow,  label: "Overflow Events"    },
            { icon: <TriangleAlert size={20} color="#FF9705" />, bg: "bg-[#F4E4A7]", count: warning, label: "Warning"           },
            { icon: <Waves      size={20} color="#1868A9" />, bg: "bg-[#1868A929]", count: normal,  label: "Normal"             },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-20 w-85 flex items-center p-6 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{card.count}</span>
                <p className="text-sm">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* body */}
        <div className='flex gap-5 mt-3'>

          {/* table */}
          <div className='rounded-lg bg-[#FAFCFD] shadow-2xl border border-[#C6C6C8] flex-1 flex flex-col'>
            {/* filters */}
            <div className='flex gap-3 items-center p-4'>
              <SearchFilter value={search} onChange={setSearch} placeholder='Search sensor node or barangay...' />
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
                  <TableHead className='font-semibold text-center text-[#727272]'>WATER LEVEL</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>FLOW RATE</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>CLOG</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>CONDITION</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>STATUS</TableHead>
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
                      <TableCell className='text-center'>{node.water_level != null ? `${node.water_level} cm` : "—"}</TableCell>
                      <TableCell className='text-center'>{node.water_flow_rate != null ? `${node.water_flow_rate} m/s` : "—"}</TableCell>
                      <TableCell className='text-center'>{node.clog_pct != null ? `${node.clog_pct} %` : "—"}</TableCell>
                      <TableCell className={`text-center font-semibold ${getConditionClass(node.condition)}`}>{node.condition}</TableCell>
                      <TableCell className='text-center'>
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${getStatusClass(node.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getDotClass(node.status)}`} />
                          {node.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* live alerts */}
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-57 rounded-lg flex flex-col'>
            <div className='flex items-center justify-between p-3'>
              <p className='font-semibold text-[#122A48]'>Live Alerts</p>
            </div>
            <hr className='border-[#C6C6C8]' />
            <div className='flex flex-col gap-2 p-2 overflow-y-auto'>
              {alerts.slice(0, 6).map(alert => {
                const style = ALERT_STYLE[alert.alert_type] ?? ALERT_STYLE.default
                return (
                  <div key={alert.alert_id} className={`flex items-center gap-3 p-2 rounded-lg border ${style.border} bg-white`}>
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
              })}
            </div>
          </div>

          {/* device status */}
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-57 rounded-lg flex flex-col'>

          </div>

        </div>
      </div>
    </>
  )
}