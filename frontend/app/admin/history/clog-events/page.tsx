"use client"

// icons
import { Upload, Radar, ArchiveRestore, Clock3, ClipboardCheck, FileSearch, Download, } from "lucide-react"

// component 
import { SearchFilter } from "@/components/SearchFilter"

// react
import { useState, useEffect } from "react"

// shadcn
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

// table pagination
import { usePagination } from "@/components/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

// auth
import { fetchWithAuth } from "@/lib/auth"

// lib
import { getDuration, formatCooldown, getErrorMessage } from "@/lib/utils"

type Clogs = {
  event_id: number
  severity: string
  detected_at: string
  resolved_at: string
  status: string
  barangay_details: { barangay_id: number; barangay_name: string } | null
  node_details: {
    node_id: number
    node_name: string
    water_level: number | null
    water_flow_rate: number | null
  } | null
  cleared_by_details : {
    user_id: number
    first_name: string
    last_name: string
    position: string
  } | null
}

type ClogMedia = {
  media_id: number
  event_id: number
  file_url: string
  media_type: string
  media_category: string
}

const CATEGORY_LABELS: Record<string, string> = {
  Sensor_Detection: 'Sensor Image',
  Before_Clearing: 'Before',
  After_Clearing: 'After',
}

export default function ClogEvents() {
  // filter states
  const [search, setSearch] = useState<string>('')
  const [barangay, setBarangay] = useState('All Barangay')
  const [severity, setSeverity] = useState('All Severity')

  // table state
  const [clogs, setClogs] = useState<Clogs[]>([])
  const [allBarangays, setAllBarangays] = useState<{ barangay_id: number; barangay_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  // selected clog state
  const [selectedClog, setSelectedClog] = useState<Clogs | null>(null)
  const [clogMedia, setClogMedia] = useState<ClogMedia[]>([])

  console.log(selectedClog)

  function getFilteredClogs(clogs: Clogs[], severity: string, barangay: string, search: string) {
  const q = search.toLowerCase()
  return clogs
    .filter(b => severity === "All Severity" || b.severity === severity)
    .filter(b => barangay === "All Barangay" || b.barangay_details?.barangay_name === barangay)
    .filter(b =>
      [b.node_details?.node_name, b.barangay_details?.barangay_name, b.severity]
        .some(field => field?.toLowerCase().includes(q))
    )
    .sort((a, b) => b.event_id - a.event_id)
}

  const filtered = getFilteredClogs(clogs, severity, barangay, search)
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)

  // summary cards
  const total = clogs.length
  const cleared = clogs.filter(n => n.status === 'Cleared').length
  const avg_time = 0
  const month_complete = 0

  const fetchClogs = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const params = new URLSearchParams()
      if (severity !== 'All Severity') params.append('severity', severity)

      const query = params.toString()

      const clogRes = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clog-events/${query ? `?${query}` : ''}`
      )
      if (!clogRes.ok) throw new Error()
      const clogData = await clogRes.json()

      setClogs(clogData.results ?? clogData)
      setCurrentPage(1)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClogs()
  }, [severity])

  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangays/?is_registered=true`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAllBarangays(data.results ?? data)
      } catch {}
    }
    fetchBarangays()
  }, [])

  useEffect(() => {
    if (!selectedClog) {
      setClogMedia([])
      return
    }

    const fetchMedia = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/report-media/clog-event/${selectedClog.event_id}/`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setClogMedia(data.results ?? data)
      } catch {
        setClogMedia([])
      }
    }
    fetchMedia()
  }, [selectedClog])

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* filter adn export container */}
        <div className="flex justify-between w-full">
          {/* filters */}
          <div className="flex gap-3 w-full">
            <SearchFilter value={search} onChange={setSearch} placeholder='Search clog...' height="h-11" />

            <Select value={barangay} onValueChange={setBarangay}>
              <SelectTrigger className="w-35 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="All Barangay" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-35 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All Barangay">All Barangay</SelectItem>
                {[...allBarangays]
                  .sort((a, b) => a.barangay_name.localeCompare(b.barangay_name))
                  .map(b => (
                    <SelectItem key={b.barangay_id} value={b.barangay_name} className="p-2 text-[#122A48]">
                      {b.barangay_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-35 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-35 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All Severity">All Severity</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Low">Low</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Medium">Medium</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button className="text-[#122A48] border border-[#C6C6C8] rounded-lg bg-[#FAFCFD] px-3 py-5 cursor-pointer hover:bg-[#d8e9f2]">
              <Upload size={23}/>
              Export
            </Button>
          </div>

        </div>

        {/* summary cards */}
        <div className="flex justify-between w-full text-[#122A48] mt-3">
          {[
            { icon: <Radar size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: total,label: "Total Clog Events" },
            { icon: <ArchiveRestore size={20} color="#FF9705" />, bg: "bg-[#F0FBB2]", count: cleared,  label: "Cleared Events"},
            { icon: <Clock3 size={20} color="#582579" />, bg: "bg-[#E5EAFF]", count: 0, label: "Average Resolution Time" },
            { icon: <ClipboardCheck size={20} color="#A21111" />, bg: "bg-[#D8101059]", count: 0,  label: "Monthly Completed Events" },
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

        {/* table and preview */}
        <div className="flex gap-3 mt-3 h-full">

          {/* Table */}
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-250 rounded-lg flex flex-col'>
            <Table>
              <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC] h-12'>
                <TableRow>
                  <TableHead className='font-semibold text-center text-[#727272]'>EVENT ID</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>SEVERITY</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>DETECTED AT</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>RESOLVED AT</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>LOCATION</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>WATER LEVEL</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>WATER FLOW</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* fetch error state */}
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-base">Failed to clog events. Please try again later.</p>
                          <Button onClick={fetchClogs} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  
                  // no node state
                  ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-15">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <Radar size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No clog events in the system</p>
                        <p className="text-[#727272] text-sm">
                          No clog events have been added yet.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                
                  // with clog event states
                  ) : (
                    paginated.map(clog => (
                      <TableRow
                        key={clog.event_id}
                        className={`border-b border-[#C6C6C8] cursor-pointer ${
                          selectedClog?.event_id === clog.event_id
                            ? 'bg-[#CDE3DE45]'
                            : 'hover:bg-[#f5f5f5]'
                        }`}
                        onClick={() => setSelectedClog(clog)}
                       >
                        <TableCell className="text-[#122A48] text-center h-18">{clog.event_id}</TableCell>
                        <TableCell className="text-center h-18">
                          <span className={`inline-flex items-center px-5 py-1 rounded-full text-[13px] font-semibold ${
                            clog.severity === 'High'   ? 'bg-[#FFE5E5] text-[#D81010]' :
                            clog.severity === 'Medium' ? 'bg-[#F4E4A7] text-[#E4B600]' :
                            'bg-[#B2FBC173] text-[#2C7B3C]'
                          }`}>
                            {clog.severity}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">
                          {clog.detected_at
                            ? new Date(clog.detected_at).toLocaleString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">
                          {clog.resolved_at
                            ? new Date(clog.resolved_at).toLocaleString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">Brgy. {clog?.barangay_details?.barangay_name}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{clog?.node_details?.water_level} cm</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">~ {clog?.node_details?.water_flow_rate} m/s</TableCell>
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

        {/* preview of selected clog event */}
        <div className="border border-[#C6C6C8] rounded-lg bg-[#F8F9FA] w-85">
          {!selectedClog ? (
            <div className="flex flex-col gap-3 justify-center items-center h-full">
              <FileSearch size={70} className="text-[#1565BC80]"/>
              <p className="text-[#122A488F] font-bold -my-1">No Event Selected</p>
              <p className="text-[#122A4873] text-xs text-center">Select a record from the table <br />to view details.</p>
            </div>

          ) : (
            <div className="flex flex-col gap-3 text-[#122A48">

              {/* Event details */}
              <div className="p-3 px-4 ull font-medium -mb-3">
                <p className="text-[#122A48]">Event details</p>
              </div>

              <hr />

              <div className="flex gap-3 px-4 justify-between">
                <div className="flex flex-col gap-3">
                  <p className="text-[#1565BC] underline">CLG-202610{selectedClog.event_id}</p>
                  <p className="text-sm">Clog event - {selectedClog.severity}</p>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-5 py-1 rounded-full text-[13px] font-semibold ${
                    selectedClog.severity === 'High'   ? 'bg-[#FFE5E5] text-[#D81010]' :
                    selectedClog.severity === 'Medium' ? 'bg-[#F4E4A7] text-[#E4B600]' :
                    'bg-[#B2FBC173] text-[#2C7B3C]'
                  }`}>
                    {selectedClog.severity}
                  </span>
                </div>
              </div>
              
              <hr />

              {/* Event inforamtion */}
              <div className="text-[#122A48] px-4 flex flex-col gap-3">
                <div>
                  <p className="font-medium">Event Information</p>
                </div>
                <div className="flex justify-between text-[13px]">
                  <p>Location (Barangay)</p>
                  <p>{selectedClog.barangay_details?.barangay_name}</p>
                </div>
                <div className="flex justify-between text-[13px]">
                  <p>Detected At</p>
                  <p>
                    {selectedClog.detected_at
                      ? new Date(selectedClog.detected_at).toLocaleString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                      : '—'}
                  </p>
                </div>
                <div className="flex justify-between text-[13px]">
                  <p>Sensor Node</p>
                  <p>{selectedClog.node_details?.node_name}</p>
                </div>
              </div>

              <hr />
              
              {/* Incident details */}
              <div className="text-[#122A48] px-4 flex flex-col gap-3">
                <div className="w-full">
                  <p className="font-medium">Incident Details</p>
                </div>

                <div className="flex justify-between text-[13px]">
                  <p>Water Level</p>
                  <p>{selectedClog.node_details?.water_level} cm</p>
                </div>

                <div className="flex justify-between text-[13px]">
                  <p>Water Flow</p>
                  <p>~ {selectedClog.node_details?.water_flow_rate} m/s</p>
                </div>
                
                <div className="flex justify-between text-[13px]">
                  <p>Severity</p>
                  <p>{selectedClog.severity}</p>
                </div>

                <div className="flex justify-between text-[13px]">
                  <p>Status</p>
                  <p>{selectedClog.status}</p>
                </div>

              </div>
              
              {/* Response information */}
              <hr />

              <div className="text-[#122A48] px-4 flex flex-col gap-3">
                <div className="w-full">
                  <p className="font-medium">Response Information</p>
                </div>

                {selectedClog.status !== "Cleared" && selectedClog.status !== "Verified" ? (
                  <div className="flex flex-col gapp2 justify-center items-center py-3">
                    <Clock3 size={30}/>
                    <p className="text-[13px] text-center">Clog event has not <br /> been cleared yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <p>Submitted by</p>
                      <p>{selectedClog.cleared_by_details?.position}</p>
                    </div>

                    <div className="flex justify-between text-[13px]">
                      <p>Resolved at</p>
                      <p>
                        {selectedClog.resolved_at
                        ? new Date(selectedClog.resolved_at).toLocaleString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                        : '—'}
                      </p>
                    </div>

                    <div className="flex justify-between text-[13px]">
                      <p>Duration</p>
                      <p>{selectedClog.resolved_at ? getDuration(selectedClog.detected_at, selectedClog.resolved_at) : '—'}</p>
                    </div>
                  </>
                )}

              </div>

              <hr />

              <div className="text-[#122A48] px-4 flex flex-col gap-3">
                <div className="w-full">
                  <p className="font-medium">Attachments</p>
                </div>

                {selectedClog.status !== "Cleared" && selectedClog.status !== "Verified" ? (
                  <div className="flex flex-col gapp2 justify-center items-center py-3">
                    <Clock3 size={30}/>
                    <p className="text-[13px] text-center">Clog event has not <br /> been cleared yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      {['Sensor_Detection', 'Before_Clearing', 'After_Clearing'].map(category => {
                        const item = clogMedia.find(m => m.media_category === category)
                        return (
                          <div key={category} className="flex flex-col items-center gap-1">
                            {item ? (
                              <img src={item.file_url} alt={category} className="rounded-lg w-20 h-20 object-cover" />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-[#E5E5E6] flex items-center justify-center">
                                <p className="text-[10px] text-[#C6C6C8] text-center px-1">No image</p>
                              </div>
                            )}
                            <p className="text-xs text-[#727272] text-center">{CATEGORY_LABELS[category]}</p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mb-3">
                      <Button className="rounded-lg bg-[#25893ACC] px-3 py-2 text-white">
                        <Download size={30}/>
                        Download Attachments
                      </Button>
                    </div>
                  </>
                )}


              </div>

            </div>
          )}
          
        </div>

        </div>



      </div>
    </>
  )
}
