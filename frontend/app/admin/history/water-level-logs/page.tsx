"use client"

// components
import { SearchFilter } from "@/components/SearchFilter"
import { usePagination } from "@/components/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import AgosMapWrapper from "@/components/Map/AgosMapWrapper"

// icons
import { Calendar as CalendarIcon, ChevronDown, RadioTower, Map, X } from "lucide-react"

// react
import { useEffect, useState, useRef, useMemo } from "react"

// shadcn
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTitle, DialogContent, DialogHeader } from "@/components/ui/dialog"

// auth
import { fetchWithAuth } from "@/lib/auth";


type Barangay = {
  barangay_id: number
  barangay_name: string
  latitude: number
  longitude: number
  is_registered: string
}

type SensorNode = {
  node_id: number
  barangay_details: { barangay_id: number; barangay_name: string } | null
  hotspot_details: { hotspot_id: number; name: string; latitude: number; longitude: number } | null
  node_name: string
  availability_status: string
  status: string
  installed_at: string
  condition: string | null
  water_level: number | null
  water_flow_rate: number | null
  clog_pct: number | null
}

type SensorReadings = {
  reading_id: number
  timestamp: string
  reading_status: string
  water_level: number | null
  water_flow_rate: number | null
  clog_pct: number | null
  node_details: {
    node_id: number
    node_name: string
    barangay_details: { barangay_id: number; barangay_name: string } | null
    hotspot_details: { hotspot_id: number; name: string; latitude: number; longitude: number } | null
  }
}

type MapDialog = {
  open: boolean
  node?: SensorReadings['node_details'] | null
}


export default function WaterLevelLog() {
  // fitler states
  const [search, setSearch] = useState<string>('')
  const [barangayFilter, setBarangayFilter] = useState<string>('All Barangay')
  const [nodeFilter, setNodeFilter] = useState<string>('All Nodes')
  const [readingStatusFilter, setReadingStatusFilter] = useState<string>('All Status')
  // date filter state
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // data states
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([])
  const [allNodes, setAllNodes] = useState<SensorNode[]>([])
  const [allReadings, setAllReadings] = useState<SensorReadings[]>([])

  // table state
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchError, setFetchError] = useState(false)

  // map dialog state
  const [viewMapDialog, setViewMapDialog] = useState<MapDialog>({open: false, node: null})

  const filtered = allReadings
    .filter(r => barangayFilter === 'All Barangay' || String(r.node_details.barangay_details?.barangay_id) === barangayFilter)
    .filter(r => nodeFilter === 'All Nodes' || String(r.node_details.node_id) === nodeFilter)
    .filter(r => readingStatusFilter === 'All Status' || r.reading_status === readingStatusFilter)
    .filter(r =>
      [r.node_details.node_name, r.node_details.barangay_details?.barangay_name, r.node_details.hotspot_details?.name]
        .some(f => f?.toLowerCase().includes(search.toLowerCase()))
    )
    .filter(r => {
      if (!startDate && !endDate) return true
      const readingDate = new Date(r.timestamp).toISOString().split('T')[0]
      if (startDate && readingDate < startDate) return false
      if (endDate && readingDate > endDate) return false
      return true
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 8)

  const fetchAllNodes = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllNodes(data.results ?? data)
      setCurrentPage(1)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAllNodes() }, [])

  const fetchAllReadings = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-readings/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllReadings(data.results ?? data)
      setCurrentPage(1)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAllReadings() }, [])

  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangays/`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAllBarangays(data.results ?? data)
      } catch {}
    }
    fetchBarangays()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const dateLabel = useMemo(() => {
    if (startDate && endDate) return `${startDate} to ${endDate}`
    if (startDate) return `From: ${startDate}`
    if (endDate) return `Until: ${endDate}`
    return "Filter by Date"
  }, [startDate, endDate])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, barangayFilter, nodeFilter, readingStatusFilter, startDate, endDate, setCurrentPage])
    
  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* filters */}
        <div className="flex justify-between">
          <div>
            <SearchFilter value={search} onChange={setSearch} placeholder='Search Nodes...' width="w-100" height="h-11" />
          </div>

          <div className="flex gap-2">
            {/* barnagay filter */}
            <Select value={barangayFilter} onValueChange={setBarangayFilter}>
              <SelectTrigger className='!font-normal bg-[#FAFCFD] py-0 md:py-[20px] text-xs md:text-sm rounded-lg border-[#727272]'>
                <SelectValue placeholder="Select Barangay..." />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                <SelectItem value="All Barangay" className="p-1 md:p-2 text-[#122A48]">All Barangay</SelectItem>
                {[...allBarangays]
                  .sort((a, b) => a.barangay_name.localeCompare(b.barangay_name))
                  .map(b => (
                    <SelectItem key={b.barangay_id} value={String(b.barangay_id)} className="p-1 md:p-2 text-[#122A48]">
                      {b.barangay_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* node filter */}
            <Select value={nodeFilter} onValueChange={setNodeFilter}>
              <SelectTrigger className='!font-normal bg-[#FAFCFD] py-0 md:py-[20px] text-xs md:text-sm rounded-lg border-[#727272]'>
                <SelectValue placeholder="Select node..." />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                <SelectItem value="All Nodes" className="p-1 md:p-2 text-[#122A48]">All Nodes</SelectItem>
                {allNodes.length === 0 ? (
                  <div className="p-2 text-xs text-[#727272] text-center">No available nodes</div>
                ) : (
                  allNodes.map(n => (
                    <SelectItem key={n.node_id} value={String(n.node_id)} className="p-1 md:p-2 text-[#122A48]">
                      {n.node_name} {n.barangay_details ? `(${n.barangay_details.barangay_name})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Reading Status */}
            <Select value={readingStatusFilter} onValueChange={setReadingStatusFilter}>
              <SelectTrigger className="w-30 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-36 min-w-0">
                <SelectItem className="p-2 text-[#122A48]" value="All Status">All Status</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Normal">Normal</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Warning">Warning</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            {/* Date filter */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-[240px] h-11 px-3 border border-[#D0D0D0] rounded-lg bg-white text-[12px] font-normal transition-colors outline-none text-left ${
                  startDate || endDate ? "text-[#122A48]" : "text-[#999999]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-[#122A48]" />
                  <span>{dateLabel}</span>
                </div>
                <ChevronDown size={14} className="text-[#999999]" />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-1.5 p-4 bg-white border border-[#D0D0D0] rounded-lg shadow-xl z-50 flex flex-col gap-3 w-[280px]">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#727272] uppercase tracking-wide">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-9 border border-[#D0D0D0] rounded-md px-2 text-[12px] outline-none text-[#122A48]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#727272] uppercase tracking-wide">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-9 border border-[#D0D0D0] rounded-md px-2 text-[12px] outline-none text-[#122A48]"
                    />
                  </div>

                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => { setStartDate(''); setEndDate('') }}
                      className="w-full text-center py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-dashed border-red-200 mt-1 transition"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* table */}
        <div className="mt-2 border border-[#C6C6C8] rounded-lg bg-[#FAFCFD] h-140 flex flex-col">
          <div className="w-full">
            <p className="text-[#122A48] p-2 text-sm font-bold">Sensor Node Water Level Readings Logs</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
                <TableRow>
                  <TableHead className="font-semibold text-center text-[#727272] text-xs">TIMESTAMP</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272] text-xs">NODE ID</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272] text-xs">NODE NAME</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272] text-xs">BARANGAY</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272] text-xs">LOCATION</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272] text-xs">WATER LEVEL</TableHead>
                  <TableHead className="font-semibold text-center text-[#727272] text-xs">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-base">Failed to load readings. Please try again.</p>
                          <Button onClick={fetchAllReadings} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-40">
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-[#E5E5E6] p-4">
                            <RadioTower size={36} color="#727272" />
                          </div>
                          <p className="text-[#122A48] font-bold">No water level readings yet</p>
                          <p className="text-[#727272] text-sm">Wait for the sensor to receive new readings.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map(read => (
                      <TableRow key={read.reading_id} className="border-b border-[#C6C6C8]">
                        <TableCell className="text-xs text-[#122A48] text-center h-[53.5px]">
                          {read.timestamp
                              ? new Date(read.timestamp).toLocaleString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                              : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-[#122A48] text-center h-[53.5px]">{read.node_details.node_id}</TableCell>
                        <TableCell className="text-xs text-[#122A48] text-center h-[53.5px]">{read.node_details.node_name}</TableCell>
                        <TableCell className="text-xs text-[#122A48] text-center h-[53.5px]">{read.node_details.barangay_details?.barangay_name}</TableCell>
                        <TableCell className="text-xs text-center h-[53.5px]">
                          <Button className="text-xs text-[#2C7B3C] bg-[#B2FBC173] hover:bg-[#9ae2a873] border border-[#C6C6C8] cursor-pointer" onClick={() => setViewMapDialog({ open: true, node: read.node_details })}>
                            <Map size={16} /> View on map
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs text-[#122A48] text-center h-[53.5px]">{read.water_level} cm</TableCell>
                        <TableCell className="text-xs text-[#122A48] text-center h-[53.5px]">
                          {read.reading_status}
                        </TableCell>

                      </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-auto">
            <TablePagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>



      </div>

      {/* View Map Dialog */}
      <Dialog open={viewMapDialog.open}>
        <DialogContent className="[&>button]:hidden p-4 md:p-6 text-[#122A48] rounded-lg border border-[#C6C6C8] min-w-80 md:min-w-150">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <p className="font-bold text-base md:text-lg">{viewMapDialog.node?.node_name}</p>
              <button className="cursor-pointer" onClick={() => setViewMapDialog({ open: false, node: null })}>
                <X size={18} />
              </button>
            </div>
          </DialogHeader>
          <div className="h-100 md:h-[380px] rounded-b-lg w-70 md:w-140 overflow-hidden">
            <AgosMapWrapper
              latitude={viewMapDialog.node?.hotspot_details?.latitude}
              longitude={viewMapDialog.node?.hotspot_details?.longitude}
              label={viewMapDialog.node?.node_name}
              zoom={15}
              showLegend={false}
            />
          </div>
          <div className="border-t border-[#C6C6C8] flex justify-between py-3 -mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <p className="text-xs md:text-sm">{viewMapDialog.node?.hotspot_details?.latitude}</p>
              <p className="text-xs md:text-sm">{viewMapDialog.node?.hotspot_details?.longitude}</p>
            </div>
            <Button
              disabled={!viewMapDialog.node?.hotspot_details?.latitude}
              onClick={() => {
                const n = viewMapDialog.node
                if (!n) return
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${n.hotspot_details?.latitude},${n.hotspot_details?.longitude}`, '_blank')
              }}
              className="cursor-pointer rounded-lg border border-[#C6C6C8] bg-[#FAFCFD] hover:bg-[#d6e4eb] px-3 py-2 md:px-4 md:py-3 text-[#727272]"
            >
              <Map /> Open in Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    
    </>
  )
}