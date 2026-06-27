"use client"

// components
import { SearchFilter } from "@/components/SearchFilter"
import { usePagination } from "@/components/hooks/usePagination"
import { TablePagination } from "@/components/TablePagination"

// react
import { useEffect, useState } from "react"

// shadcn
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

// auth
import { fetchWithAuth } from "@/lib/auth"

// icons
import { Upload, LayoutGrid, Leaf, Recycle, Trash2, FileSearch } from "lucide-react"


type WasteClassification = {
  classification_id: number
  node_details: {
    node_id: number
    node_name: string
    barangay_details: {
      barangay_id: number
      barangay_name: string
    }
  }
  dominant_waste_type: string
  timestamp: string
  reading: number
  confidence: number
  estimated_volume: number
  recyclable_pct: number
  biodegradable_pct: number
  residual_pct: number
  special_waste_pct: number
}


export default function Waste() {
  // filter states
  const [search, setSearch] = useState<string>('')
  const [barangayFilterOpt, setBarangayFilterOpt] = useState<string>('All Barangay')
  const [dominantWaste, setDominantWaste] = useState<string>('All Waste')
  const [sensorNode, setSensorNode] = useState<string>('All Nodes')

  // waste classification state
  const [wasteClassification, setWasteClassification] = useState<WasteClassification[]>([])
  const [allBarangays, setAllBarangays] = useState<{ barangay_id: number; barangay_name: string }[]>([])
  const [allSensorNodes, setAllSensorNodes] = useState<{ node_id: number; node_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [selectedWaste, setSelectedWaste] = useState<WasteClassification | null>(null)

  function getFilteredWaste(waste: WasteClassification[], barangay: string, dominant_waste: string, node: string, search: string) {
    const q = search.toLowerCase()
    return waste
      .filter(b => barangay === "All Barangay" || b.node_details?.barangay_details?.barangay_name === barangay)
      .filter(b => dominant_waste === "All Waste" || b.dominant_waste_type === dominant_waste)
      .filter(b => node === "All Nodes" || b.node_details?.node_name === node)
      .filter(b =>
        [b.node_details?.node_name, b.node_details?.barangay_details?.barangay_name, b.dominant_waste_type]
          .some(field => field?.toLowerCase().includes(q))
      )
      .sort((a, b) => b.classification_id - a.classification_id)
    }
  
    const filtered = getFilteredWaste(wasteClassification, barangayFilterOpt, dominantWaste, sensorNode, search)
    const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)
  
    // summary cards
    const total = wasteClassification.length
    const biodegradable = wasteClassification.filter(n => n.dominant_waste_type === 'Biodegradable').length
    const recyclable = wasteClassification.filter(n => n.dominant_waste_type === 'Recyclable').length
    const residual_others = wasteClassification.filter(n => n.dominant_waste_type === 'Residual' || n.dominant_waste_type === 'Special Waste').length

    // fetch waste classifications
    const fetchWaste = async () => {
      setLoading(true)
      setFetchError(false)
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/waste-classifications/`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        console.log('waste data:', JSON.stringify(data.results ?? data, null, 2))
        setWasteClassification(data.results ?? data)
      } catch {
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchWaste()
    }, [])

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
      const fetchSensorNodes = async () => {
        try {
          const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`)
          if (!res.ok) throw new Error()
          const data = await res.json()
          setAllSensorNodes(data.results ?? data)
        } catch {}
      }
      fetchSensorNodes()
    }, [])


  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* filter */}
        <div className="flex w-full justify-between">
          <div className="flex gap-3">
            <SearchFilter value={search} onChange={setSearch} placeholder='Search...' height="h-11" />

            {/* barangay filter */}
            <Select value={barangayFilterOpt} onValueChange={setBarangayFilterOpt}>
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
            
            {/* dominant waste type filter */}
            <Select value={dominantWaste} onValueChange={setDominantWaste}>
              <SelectTrigger className="w-35 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="All Barangay" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-35 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All Waste">All Waste</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Recyclable">Recyclable</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Biodegradable">Biodegradable</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Residual">Residual</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Special Waste">Special Waste</SelectItem>
              </SelectContent>
            </Select>

            {/* sensor node filter */}
            <Select value={sensorNode} onValueChange={setSensorNode}>
              <SelectTrigger className="w-35 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="All Nodes" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-35 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All Nodes">All Nodes</SelectItem>
                {[...allSensorNodes]
                  .sort((a, b) => a.node_name.localeCompare(b.node_name))
                  .map(n => (
                    <SelectItem key={n.node_id} value={n.node_name} className="p-2 text-[#122A48]">
                      {n.node_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            {/* <Button className="cursor-pointer rounded-lg bg-[#FAFCFD] hover:bg-[#d5e2e8] text-[#122A48] border border-[#C6C6C8] px-3 py-5">
              <Upload size={25}/>
              Export
            </Button> */}
          </div>

        </div>

        {/* summary header cards */}
        <div className="flex justify-between w-full text-[#122A48] mt-3">
          {[
            { icon: <LayoutGrid size={20} color="#582579" />, bg: "bg-[#E1CDE3]", count: total,label: "Total Clasifications" },
            { icon: <Leaf size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: biodegradable,  label: "Biodegradable"},
            { icon: <Recycle size={20} color="#1565BC" />, bg: "bg-[#1565BC61]", count: recyclable, label: "Recyclable" },
            { icon: <Trash2 size={20} color="#D48A00" />, bg: "bg-[#EED7AA]", count: residual_others,  label: "Residual/Others" },
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

        {/* table and preview data */}
        <div className="flex gap-2 mt-2">
          
          {/* TABLE  */}
          <div className='bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] h-120 w-250 rounded-lg flex flex-col'>
            <Table>
              <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC] h-12'>
                <TableRow>
                  <TableHead className='font-semibold text-center text-[#727272]'>CLASSIFICATION ID</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>DOMINANT WASTE TYPE</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>TIMESTAMP</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>NODE</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>LOCATION  </TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>READING ID</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>CONFIDENCE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* fetch error state */}
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-base">Failed to waste Classifications. Please try again later.</p>
                          <Button onClick={fetchWaste} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  
                  // no node state
                  ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-33">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <Trash2  size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No waste classifications in the system</p>
                        <p className="text-[#727272] text-sm">
                          No waste classifications have been added yet.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                
                  // with clog event states
                  ) : (
                    paginated.map(waste => (
                      <TableRow
                        key={waste.classification_id}
                        className={`border-b border-[#C6C6C8] cursor-pointer ${
                          selectedWaste?.classification_id === waste.classification_id
                            ? 'bg-[#CDE3DE45]'
                            : 'hover:bg-[#f5f5f5]'
                        }`}
                        onClick={() => setSelectedWaste(waste)}
                      >
                        <TableCell className="text-[#122A48] text-center h-18">WCL-20261026-00{waste.classification_id}</TableCell>
                        <TableCell className="text-center h-18">
                          <span className="inline-flex items-center gap-2">
                            <span className={`rounded-full p-1.5 flex items-center justify-center ${
                              waste.dominant_waste_type === 'Biodegradable' ? 'bg-[#51C96A]' :
                              waste.dominant_waste_type === 'Recyclable'    ? 'bg-[#1565BC]' :
                              waste.dominant_waste_type === 'Residual'      ? 'bg-[#D89210]' :
                              waste.dominant_waste_type === 'Special Waste' ? 'bg-[#D81010]' :
                              'bg-gray-400'
                            }`}>
                              {waste.dominant_waste_type === 'Biodegradable' && <Leaf size={16} color="white" />}
                              {waste.dominant_waste_type === 'Recyclable'    && <Recycle size={16} color="white" />}
                              {waste.dominant_waste_type === 'Residual'      && <Trash2 size={16} color="white" />}
                              {waste.dominant_waste_type === 'Special Waste' && <Trash2 size={16} color="white" />}
                            </span>
                            <span className="text-[#122A48] ">{waste.dominant_waste_type}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">
                          {waste.timestamp
                            ? new Date(waste.timestamp).toLocaleString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">
                          {waste.node_details?.node_name ?? '—'}
                        </TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{waste.node_details?.barangay_details?.barangay_name ?? '—'}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">RDG-0{waste.reading ?? '—'}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{waste.confidence ?? '—'}%</TableCell>
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


          {/* preview waste container */}
          <div className="border border-[#C6C6C8] rounded-lg bg-[#F8F9FA] w-85">
            {!selectedWaste ? (
              <div className="flex flex-col gap-3 justify-center items-center h-full">
                <FileSearch size={60} className="text-[#1565BC80]"/>
                <p className="text-[#122A488F] font-bold -my-1">No Waste Selected</p>
                <p className="text-[#122A4873] text-xs text-center">Select a record from the table <br />to view details.</p>
              </div>

            ) : (
              <div className="flex flex-col gap-3 text-[#122A48]">
                <div className="w-full -mb-2">
                  <p className="p-3 font-medium">Classification details</p>
                </div>

                <hr className="-mt-1.5" />

                <div className="w-full">
                  <p className="underline text-[#1565BC] p-3 py-1.5">WCL-20261026-00{selectedWaste.classification_id}</p>
                </div>

                <hr />

                <div className="flex flex-col p-3 pt-0 -mb-2">
                  <div className="w-full">
                    <p className="font-medium ">Classification Information</p>
                  </div>

                  {/* dominant waste type */}
                  <div className="flex justify-between mt-2 text-sm">
                    <p>Dominant Waste Type</p>
                    <p className="text-left">{selectedWaste.dominant_waste_type}</p>
                  </div>
                  {/* confidence */}
                  <div className="flex justify-between mt-1 text-sm">
                    <p>Confidence</p>
                    <p className="text-left">{selectedWaste.confidence}%</p>
                  </div>
                  {/* timestamp */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Timestamp</p>
                    <p>
                      {selectedWaste.timestamp
                        ? new Date(selectedWaste.timestamp).toLocaleString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })
                      : '—'}
                    </p>
                  </div>
                  {/* estimated weight */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Estimated weight (kg)</p>
                    <p className="text-left">{selectedWaste.estimated_volume} kg</p>
                  </div>
                  {/* location */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Location</p>
                    <p className="text-left">{selectedWaste.node_details.barangay_details.barangay_name}</p>
                  </div>
                  {/* reading id */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Reading ID</p>
                    <p className="flex-left">RDG-0{selectedWaste.reading}</p>
                  </div>
                  {/* sensor node */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Sensor Node</p>
                    <p className="flex-left">{selectedWaste.node_details.node_name}</p>
                  </div>
                </div>

                <hr />

                <div className="flex flex-col p-3 pt-0">
                  <div className="w-full">
                    <p className="font-medium">Waste</p>
                  </div>
                  
                  {/* biodegradable */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Biodegradable</p>
                    <p>{selectedWaste.biodegradable_pct}%</p>
                  </div>
                  {/* Recyclable */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Recyclable</p>
                    <p>{selectedWaste.recyclable_pct}%</p>
                  </div>
                  {/* Residual */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Residual</p>
                    <p>{selectedWaste.residual_pct}%</p>
                  </div>
                  {/* special waste */}
                  <div className="flex justify-between text-sm mt-1">
                    <p>Special Waste</p>
                    <p>{selectedWaste.special_waste_pct}%</p>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>




      </div>
    
    </>
  )
}
