"use client"

// icons
import { FaSearch } from "react-icons/fa"
import { Siren } from "lucide-react"

// shadcn
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// react
import { useEffect, useState, useMemo  } from "react"

// auth
import { getAccessToken } from "@/lib/auth"
import { api } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

// component
import { AlertCard } from "@/components/Alerts/AlertCard"
import { usePagination } from "@/components/hooks/usePagination"
import { TablePagination } from "@/components/TablePagination"

type Alert = {
  alert_id: number
  alert_type: string
  node_name: string | null
  barangay_name: string | null
  timestamp: string
  is_read: boolean
}

type Barangay = {
  barangay_id: number
  barangay_name: string
}


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

  const filteredAlerts = useMemo(() => {
    if (!search.trim()) return alerts
    const q = search.toLowerCase()
    return alerts.filter(a =>
      a.alert_type.toLowerCase().includes(q) ||
      a.node_name?.toLowerCase().includes(q) ||
      a.barangay_name?.toLowerCase().includes(q)
    )
  }, [alerts, search])

  const { currentPage, setCurrentPage, totalPages, paginated, totalItems, itemsPerPage } = usePagination(filteredAlerts, 5)

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

  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const token = getAccessToken()
        const data = await api.get('/api/barangays/', token ?? undefined)
        setBarangays(data.results ?? data)
      } catch {}
    }
    fetchBarangays()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

   return (
     <>
      <div className="hidden md:flex flex-col">

        {/* filter container */}
        <div className="flex justify-between">
          {/* search filter */}
            <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-11">
              <FaSearch size={18} className="text-[#C6C6C8]" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-[500px]"
              />
            </div>

            <div className="flex gap-3">
              {/* barangay filter */}
              <Select value={barangay} onValueChange={setBarangay}>
                <SelectTrigger className="w-40 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position="popper" className='w-40 min-w-0'>
                  <SelectItem value="All Barangay">All Barangay</SelectItem>
                    {barangays.map(b => (
                      <SelectItem key={b.barangay_id} value={String(b.barangay_id)}>
                        {b.barangay_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* alert type filter */}
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger className="w-45 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position="popper" className='w-45 min-w-0'>
                  <SelectItem className="p-2 text-[#122A48]" value="All Alert">All Alert</SelectItem>
                  <SelectItem value="Water_Level_Rising">Water Level Rising</SelectItem>
                  <SelectItem value="High_Clog_Index">High Clog Index</SelectItem>
                  <SelectItem value="Critical_Clog">Critical Clog</SelectItem>
                  <SelectItem value="Node_Offline">Node Offline</SelectItem>
                  <SelectItem value="Low_Battery">Low Battery</SelectItem>
                  <SelectItem value="Weak_Signal">Weak Signal</SelectItem>
                  <SelectItem value="Sensor_Failure">Sensor Failure</SelectItem>
                </SelectContent>
              </Select>

              {/* date filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-35 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position="popper" className='w-35 min-w-0'>
                  <SelectItem className="p-2 text-[#122A48]" value="Today">Today</SelectItem>
                  <SelectItem className="p-2 text-[#122A48]" value="7Days">Last 7 days</SelectItem>
                  <SelectItem className="p-2 text-[#122A48]" value="30Days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>

        {/* notif list container */}
        <div className="bg-[#F8F9FA] rounded-lg mt-4 shadow-[0_0_8px_rgba(0,0,0,0.15)] flex flex-col min-h-[calc(100vh-10rem)]">
          <div className="flex w-full p-3">
            <p className="text-[#122A48] font-semibold">Notifications</p>
          </div>

          <hr />

          {/* alert cards */}
          <div className="flex flex-col gap-3 p-3 flex-1">
            {/* error fetch */}
            {fetchError ? (
              <div className="flex flex-col gap-3 p-3 flex-1 justify-center items-center">
                <p className="text-[#D81010] font-semibold text-base">Failed to load alerts. Please try again later.</p>
                <Button onClick={fetchAlerts} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
              </div>

            // no notif
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 flex-1">
                <div className="rounded-full bg-[#E5E5E6] p-4">
                  <Siren size={36} color="#727272" />
                </div>
                <p className="text-[#122A48] font-bold">No alerts today</p>
                <p className="text-[#727272] text-sm">
                  No alerts have been added today yet.
                </p>
              </div>

            // load alerts
            ) : (
              paginated.map(alert => (
                <AlertCard key={alert.alert_id} alert={alert} />
              ))
            )}
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
     
     </>
   )
 }
 
