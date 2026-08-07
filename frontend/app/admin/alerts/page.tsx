"use client"

// icons
import { Siren, X } from "lucide-react"

// shadcn
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// react
import { useEffect, useState, useMemo, useCallback } from "react"

// auth
import { getAccessToken } from "@/lib/auth"
import { api } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import { useWebSocket } from "@/lib/hooks/useWebSocket"

// component
import { usePagination } from "@/components/hooks/usePagination"
import { TablePagination } from "@/components/TablePagination"
import { usePolling } from "@/components/hooks/usePolling"
import { ALERT_META, ContextRow } from "@/components/Alerts/AlertCard"
import { ALERT_STYLE } from "@/lib/constant"
import { SearchFilter } from "@/components/SearchFilter"


type Alert = {
  alert_id: number
  alert_type: string
  node_name: string | null
  barangay_name: string | null
  timestamp: string
  is_read: boolean
  alert_context: Record<string, any> 
}

type Barangay = {
  barangay_id: number
  barangay_name: string
}

const ALERT_TYPES = [
  { value: "All Alert", label: "All" },
  { value: "Water_Level_Rising", label: "Water Level Rising" },
  { value: "Low_Clog_Alert", label: "Low Clog" },
  { value: "Moderate_Clog_Alert", label: "Moderate Clog" },
  { value: "Critical_Clog", label: "Critical Clog" },
  { value: "Node_Offline", label: "Node Offline" },
  { value: "Low_Battery", label: "Low Battery" },
  { value: "Weak_Signal", label: "Weak Signal" },
  { value: "Sensor_Failure", label: "Sensor Failure" },
]


export default function Alerts() {
  // filter states
  const [search, setSearch] = useState<string>('')
  const [barangay, setBarangay] = useState<string>('All Barangay')
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [alertType, setAlertType] = useState<string>('All Alert')
  const [dateFilter, setDateFilter] = useState<string>('Today')

  // notif state
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<boolean>(false)

  // select state
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredAlerts = useMemo(() => {
    if (!search.trim()) return alerts
    const q = search.toLowerCase()
    return alerts.filter(a =>
      a.alert_type.toLowerCase().includes(q) ||
      a.node_name?.toLowerCase().includes(q) ||
      a.barangay_name?.toLowerCase().includes(q)
    )
  }, [alerts, search])

  const { currentPage, setCurrentPage, totalPages, paginated, totalItems, itemsPerPage } = usePagination(filteredAlerts, 9)

  const fetchAlerts = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const params = new URLSearchParams()
      if (barangay !== 'All Barangay') params.append('barangay', barangay)
      if (alertType !== 'All Alert') params.append('alert_type', alertType)
      if (dateFilter) params.append('date', dateFilter)

      const query = params.toString()

      const alertsRes = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/alerts/${query ? `?${query}` : ''}`
      )
      if (!alertsRes.ok) throw new Error()
      const alertsData = await alertsRes.json()

      setAlerts(alertsData.results ?? alertsData)
      setCurrentPage(1)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [barangay, alertType, dateFilter])

  const fetchBarangays = async () => {
    try {
      const token = getAccessToken()
      const data = await api.get('/api/barangays/', token ?? undefined)
      setBarangays(data.results ?? data)
    } catch {}
  }

  useEffect(() => { fetchBarangays() }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const fetchAllAlertData = useCallback(() => {
    fetchAlerts()
    fetchBarangays()
  }, [])

  useEffect(() => {
    fetchAllAlertData()
  }, [])

  usePolling(fetchAllAlertData, 30000)

  const handleRowClick = async (alert: Alert) => {
    setSelectedAlert(alert)
    setDialogOpen(true)

    if (alert.is_read) return
    try {
      const token = getAccessToken()
      await api.post(`/api/alerts/${alert.alert_id}/mark-read/`, {}, token ?? undefined)
      setAlerts(prev => prev.map(a =>
        a.alert_id === alert.alert_id ? { ...a, is_read: true } : a
      ))
    } catch {}
  }

  useWebSocket({
    path: "/ws/alerts/",
    onMessage: (newAlert) => {
      setAlerts(prev => [newAlert, ...prev])
    },
  })

   return (
     <>
      <div className="hidden md:flex flex-col">

        {/* filter container */}
        <div className="flex justify-between">
          {/* search filter */}
            <SearchFilter value={search} onChange={setSearch} placeholder='Search notification...' height="h-9" width="w-100" />

            <div className="flex gap-3">
              {/* barangay filter */}
              <Select value={barangay} onValueChange={setBarangay}>
                <SelectTrigger className="cursor-pointer text-xs w-40 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position="popper" className='w-40 min-w-0'>
                  <SelectItem className="cursor-pointer p-2 text-xs" value="All Barangay">All Barangay</SelectItem>
                    {barangays.map(b => (
                      <SelectItem className="cursor-pointer p-2 text-xs" key={b.barangay_id} value={String(b.barangay_id)}>
                        {b.barangay_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* date filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="cursor-pointer text-xs w-35 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position="popper" className='w-35 min-w-0'>
                  <SelectItem className="cursor-pointer p-2 text-xs text-[#122A48]" value="Today">Today</SelectItem>
                  <SelectItem className="cursor-pointer p-2 text-xs text-[#122A48]" value="7Days">Last 7 days</SelectItem>
                  <SelectItem className="cursor-pointer p-2 text-xs text-[#122A48]" value="30Days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>

        {/* notif list container */}
        <div className="bg-[#F8F9FA] rounded-lg mt-2 shadow-[0_0_8px_rgba(0,0,0,0.15)] flex flex-col h-151">
          <div className="flex w-full p-3 items-center justify-between flex-wrap gap-2">
            <p className="text-[#122A48] font-semibold">Notifications</p>
            <div className="flex gap-2 flex-wrap">
              {ALERT_TYPES.map(t => (
                <Button
                  key={t.value}
                  onClick={() => setAlertType(t.value)}
                  className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium transition-colors
                    ${alertType === t.value
                      ? "bg-[#1565BC] hover:bg-[#135aa6] text-white"
                      : "bg-transparent text-[#122A48] border-[#C6C6C8] hover:bg-[#c3dffe]"
                    }`}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <hr />

          {/* alert table */}
          <div className="flex flex-col gap-3 flex-1">
            <Table>
              <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC] h-12'>
                <TableRow>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>NODE</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>TYPE</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>BARANGAY</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>DETECTED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-40">
                      <div className="flex flex-col gap-3 p-3 flex-1 justify-center items-center">
                        <p className="text-[#D81010] font-semibold text-sm">Failed to load alerts. Please try again later.</p>
                        <Button onClick={fetchAlerts} className="text-sm cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-40">
                      <div className="flex flex-col items-center justify-center gap-1 flex-1">
                        <div className="rounded-full bg-[#E5E5E6] p-4 my-2">
                          <Siren size={30} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold text-sm">No alerts today</p>
                        <p className="text-[#727272] text-xs">
                          No alerts have been added today.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map(alert => {
                    const meta = ALERT_META[alert.alert_type] ?? { label: alert.alert_type.replace(/_/g, " "), Icon: null }
                    const style = ALERT_STYLE[alert.alert_type] ?? ALERT_STYLE.default
                    return (
                      <TableRow
                        key={alert.alert_id}
                        className={`border-b border-[#C6C6C8] cursor-pointer ${alert.is_read ? "opacity-60" : ""} hover:bg-[#f5f5f5]`}
                        onClick={() => handleRowClick(alert)}
                      >
                        <TableCell className="text-[#122A48] text-left h-[50.5px] text-xs">{alert.node_name ?? "—"}</TableCell>
                        <TableCell className="text-left h-[50.5px] text-xs">
                          <span className={`inline-flex items-center gap-1.5 px-2 text-[11px] py-1 rounded-full font-semibold ${style.icon}`}>
                            {meta.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#122A48] text-left h-[50.5px] text-xs">{alert.barangay_name ?? "—"}</TableCell>
                        <TableCell className="text-[#122A48] text-left h-[50.5px] text-xs">
                          {new Date(alert.timestamp).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* pagination */}
            {!fetchError && alerts.length > 0 && (
              <TablePagination
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            )}
          
        </div>

      </div>

      {/* Alert Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="[&>button]:hidden text-[#122A48] w-[380px]">
          {selectedAlert && (() => {
            const meta = ALERT_META[selectedAlert.alert_type] ?? { label: selectedAlert.alert_type.replace(/_/g, " "), Icon: null }
            const style = ALERT_STYLE[selectedAlert.alert_type] ?? ALERT_STYLE.default
            const Icon = meta.Icon
            return (
              <>
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${style.icon}`}>
                        {Icon && <Icon size={16} />}
                      </div>
                      <p className="font-bold text-sm">{meta.label}</p>
                    </div>
                    <button onClick={() => setDialogOpen(false)} className="cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                </DialogHeader>

                <DialogTitle className="sr-only">Alert Details</DialogTitle>
                <hr />

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <p className="text-[#727272]">Node</p>
                    <p className="font-medium">{selectedAlert.node_name ?? "—"}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-[#727272]">Barangay</p>
                    <p className="font-medium">{selectedAlert.barangay_name ?? "—"}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-[#727272]">Detected</p>
                    <p className="font-medium">
                      {new Date(selectedAlert.timestamp).toLocaleString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit", hour12: true
                      })}
                    </p>
                  </div>

                  <hr />
                  <p className="font-semibold text-xs text-[#727272]">DETAILS</p>
                  <ContextRow alertType={selectedAlert.alert_type} ctx={selectedAlert.alert_context} />
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
     
     </>
   )
 }
