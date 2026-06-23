"use client"

// icons
import { RadioTower, Trash2, TriangleAlert, BadgeCheck } from "lucide-react";

// react
import { useEffect, useState } from "react"

// auth
import { fetchWithAuth } from "@/lib/auth";

// shadcn
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Button } from "@/components/ui/button"


type Hotspots = {
  hotspot_id: number
  hotpot_name: string
}

type SensorNode = {
  node_id: number
  node_name: string
  barangay_details: {
    barangay_id: number
    barangay_name: string
  }
  hotspot_details: {
    hotspot_id: number
    hotspot_name: string
    latitude: number
    longitude: number
  }
  status: string
  reading_details: {
    reading_id: number
    water_level: number | null
    water_flow_rate: number | null
    clog_pct: number | null
    condition: string
    reading_status: string
    timestamp: number
  }
}

type WasteClassification = {
  classification_id: number
  node_details: {
    node_id: number
    node_name: string
  }
  reading_details: {
    reading_id: number
    node_details: {
      node_id: number
    }
    water_level: string
    water_flow_rate: number
    water_flow: string
    reading_status: string
  }
  confidence: number
  estimated_volume: number
}

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



export default function Resources() {
  // fetch data states
  const [allSensorNodes, setAllSensorNodes] = useState<SensorNode[]>([])
  const [allHotspots, setAllHotspots] = useState<Hotspots[]>([])
  const [allWasteClassification, setAllWasteClassification] = useState<WasteClassification[]>([])
  const [allClogs, setAllClogs] = useState<Clogs[]>([])

  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  console.log('sensor', allSensorNodes)
  console.log('hotspots', allHotspots)
  console.log('waste', allWasteClassification)
  console.log('clogs', allClogs)

  // fetch of data
  const fetchSensorNode = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-nodes/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllSensorNodes(data.results ?? data)
    } catch {}
  }
  useEffect(() => {
    fetchSensorNode()
  }, [])

  const fetchHotspots = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/hotspots/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllHotspots(data.results ?? data)
    } catch {}
  }
  useEffect(() => {
    fetchHotspots()
  }, [])

  const fetchWaste = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/waste-classifications/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllWasteClassification(data.results ?? data)
    } catch {}
  }
  useEffect(() => {
    fetchWaste()
  }, [])

  const fetchClogs = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/clog-events/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllClogs(data.results ?? data)
    } catch {}
  }
  useEffect(() => {
    fetchClogs()
  }, [])
  


  // summary cards
  const totalSensorNodes = allSensorNodes.length
  const criticalAreas = allSensorNodes.filter(n => n.condition === 'Critical').length
  const totalWaste = allWasteClassification.length
  const clearedAreas = allClogs.filter(c => c.status === 'Cleared').length

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* total cards */}
        <div className="flex justify-between w-full text-[#122A48]">
          {[
          { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: totalSensorNodes, label: "Total Sensor Nodes" },
          { icon: <TriangleAlert size={20} color="#D81010" />, bg: "bg-[#FFE5E5]", count: criticalAreas, label: "Critical Areas" },
          { icon: <Trash2 size={20} color="#1f518f" />, bg: "bg-[#CDE3DE]", count: totalWaste, label: "Total Waste Classified" },
          { icon: <BadgeCheck size={20} color="#1565BC" />, bg: "bg-[#1565BC29]", count: clearedAreas, label: "Cleared Areas" },
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

        {/* waste hotspot, trash accumulated, priority */}
          <div className="flex gap-3 text-[#122A48] mt-2">
          {/* waste hotspot */}
            <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] bg-[#FAFCFD]">
            <div className="w-full">
              <p className="font-bold p-2 text-sm">WASTE HOTSPOT STATUS</p>
            </div>
            <div>
              <Table>
                <TableHeader className="bg-[#F5F6F9]">
                  <TableRow>
                    <TableHead className="text-[#727272] text-center text-xs">NODE ID</TableHead>
                    <TableHead className="text-[#727272] text-center text-xs">NAME</TableHead>
                    <TableHead className="text-[#727272] text-center text-xs">LOCATION</TableHead>
                    <TableHead className="text-[#727272] text-center text-xs">STATUS</TableHead>
                    <TableHead className="text-[#727272] text-center text-xs">LAST UPDATED</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                 {/* fetch error state */}
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-base">Failed to load waste hotspots. Please try again later.</p>
                          <Button onClick={fetchSensorNode} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allSensorNodes.map((node) => (
                      <TableRow key={node.node_id}>
                        <TableCell>{node.node_id}</TableCell>
                        <TableCell>{node.node_name}</TableCell>
                        <TableCell>{node.barangay_details.barangay_name}</TableCell>
                        <TableCell>{node.reading_details.reading_status}</TableCell>
                        <TableCell>{node.reading_details.timestamp}</TableCell>
                      </TableRow>
                    ))
                  )}
                
                </TableBody>
              </Table>
            </div>

          </div>

          {/* trash accumulated */}
          <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] bg-[#FAFCFD]">
            <div className="w-full">
              <p className="font-bold text-sm p-2">TRASH ACCUMULATION SEVERITY RANKING</p>
            </div>

            <div>
              <Table>
                <TableHeader className="bg-[#F5F6F9]">
                  <TableRow>
                    <TableHead className="text-[#727272] text-center text-xs">RANK</TableHead>
                    <TableHead className="text-[#727272] text-center text-xs">HOTSPOT</TableHead>
                    <TableHead className="text-[#727272] text-center text-xs">SEVERITY INDEX</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* fetch error state */}
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-base">Failed to load trash accumulation. Please try again later.</p>
                          <Button onClick={fetchWaste} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                    </>
                  )}

                </TableBody>
              </Table>
            </div>

          </div>

          {/* priority */}
          <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] bg-[#FAFCFD]">
            <div className="w-full p-2">
              <p className="font-bold text-sm">PRIORITY DEPLOYMENT QUEUE</p>
              <p className="text-xs">Based on severity of waste hotspot status and trash accumulation.</p>
            </div>

          </div>
        </div>


      </div>
    
    </>
  )
}

