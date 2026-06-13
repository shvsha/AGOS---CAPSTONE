"use client"

// icons
import { FaSearch } from "react-icons/fa"

// shadcn
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"

// react
import { useEffect, useState } from "react"

// auth
import { getAccessToken } from "@/lib/auth"
import { api } from "@/lib/api"

// component
import { AlertCard } from "@/components/Alerts/AlertCard"

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

  const fetchAlerts = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const token = getAccessToken()
      const params = new URLSearchParams()
      if (barangay !== 'All Barangay') params.append('barangay', barangay)
      if (alertType !== 'All Alert') params.append('alert_type', alertType)
      if (dateFilter) params.append('date', dateFilter)

      const query = params.toString()
      const data = await api.get(`/api/alerts/${query ? `?${query}` : ''}`, token ?? undefined)
      setAlerts(data.results ?? data)
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
        <div className="bg-[#F8F9FA] rounded-lg mt-4 shadow-[0_0_8px_rgba(0,0,0,0.15)]">
          <div className="flex w-full p-3">
            <p className="text-[#122A48] font-semibold">Notifications</p>
          </div>

          <hr />

          {/* alert cards */}
          <div className="flex flex-col gap-3 p-3">
            {alerts.map(alert => (
              <AlertCard key={alert.alert_id} alert={alert} />
            ))}
          </div>
          
        </div>

      </div>
     
     </>
   )
 }
 
