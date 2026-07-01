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

// component
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/components/hooks/usePagination";


type Hotspots = {
  hotspot_id: number
  hotpot_name: string
}

type SensorNode = {
  node_id: number
  node_name: string
  barangay_details: { barangay_id: number; barangay_name: string }
  hotspot_details: {
    hotspot_id: number
    hotspot_name: string
    latitude: number
    longitude: number
    canal_width: number | null
    sensor_height: number | null
    max_capacity_kg: number | null
  } | null
  status: string
  condition: string | null
  water_level: number | null
  water_flow_rate: number | null
  clog_pct: number | null
  installed_at: string
}

type SensorReadings = {
  reading_id: number
  water_level: number | null
  water_flow_rate: number | null
  clog_pct: number | null
  reading_status: string
  timestamp: string
  node_details: {
    node_id: number
    node_name: string
  }
}

type WasteClassification = {
  classification_id: number
  node_details: {
    node_id: number
    node_name: string
    barangay_details: {
      barangay_id: number
      barangay_name: string
    }
    hotspot_details: {
      hotspot_id: number
      name: string
      max_capacity_kg: number | null
    } | null
  }
  reading_details: {
    reading_id: number
    node_details: {
      node_id: number
    }
    timestamp: string
    water_level: string
    water_flow_rate: number
    water_flow: string
    reading_status: string
  }
  confidence: number
  estimated_volume: number
  timestamp: string
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

// Clog severity based on the node's actual clog_pct (water level/flow derived),
// NOT trash weight. Thresholds match lib/constant.ts getClogClass and the
// backend's clog_events/signals.py severity bands, so this stays consistent
// with the rest of the app.
const getClogSeverity = (clogPct: number | null) => {
  if (clogPct === null) {
    return { label: "Unknown", barColor: "bg-[#9CA3AF]", textClass: "text-[#727272] font-semibold" }
  }
  if (clogPct >= 75) {
    return { label: "Critical", barColor: "bg-[#D81010]", textClass: "text-[#D81010] font-semibold" }
  }
  if (clogPct >= 50) {
    return { label: "Warning", barColor: "bg-[#FF9705]", textClass: "text-[#FF9705] font-semibold" }
  }
  return { label: "Normal", barColor: "bg-[#1565BC]", textClass: "text-[#1565BC] font-semibold" }
}

// 4-tier ranking used by "Trash Accumulation Severity Ranking" and the
// Priority Deployment Queue. Thresholds match the backend's clog_events
// severity bands (High >=80, Medium >=60, Low >=30), so a node's rank here
// always lines up with its ClogEvent severity and its row in the detailed
// Waste Hotspots table below.
const getClogRankLevel = (clogPct: number | null) => {
  if (clogPct === null) {
    return { label: "UNKNOWN", color: "bg-[#9CA3AF]", action: "AWAITING CANAL DATA" }
  }
  if (clogPct >= 80) {
    return { label: "CRITICAL", color: "bg-[#E85656]", action: "IMMEDIATE ACTION" }
  }
  if (clogPct >= 60) {
    return { label: "HIGH", color: "bg-[#F39600]", action: "WITHIN 12 HOURS" }
  }
  if (clogPct >= 30) {
    return { label: "MEDIUM", color: "bg-[#FFCC00]", action: "WITHIN 24 HOURS" }
  }
  return { label: "LOW", color: "bg-[#2C7B3C]", action: "MONITOR CLOSELY" }
}



export default function Resources() {
  // fetch data states
  const [allSensorNodes, setAllSensorNodes] = useState<SensorNode[]>([])
  const [allReadings, setAllReadings] = useState<SensorReadings[]>([])
  const [allHotspots, setAllHotspots] = useState<Hotspots[]>([])
  const [allWasteClassification, setAllWasteClassification] = useState<WasteClassification[]>([])
  const [allClogs, setAllClogs] = useState<Clogs[]>([])

  console.log(allWasteClassification)

  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  
  const nodesWithHotspot = allSensorNodes.filter(n => n.hotspot_details != null)

  // Single source of truth for "how clogged is this node right now" — used by
  // the ranking sort, the Priority Deployment Queue, and the detailed table,
  // so all three always agree on the same node's number.
  const getLatestClogPct = (nodeId: number) => {
    const nodeReadings = allReadings
      .filter(r => r.node_details.node_id === nodeId)
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    const latestReading = nodeReadings[0] ?? null
    const fallbackNode = allSensorNodes.find(n => n.node_id === nodeId)
    return {
      clogPct: latestReading?.clog_pct ?? fallbackNode?.clog_pct ?? null,
      latestReading,
    }
  }
  
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(nodesWithHotspot, 3)
  
  const latestWastePerNode = Object.values(
    allWasteClassification.reduce((acc, waste) => {
      const nodeId = waste.node_details.node_id

      // Ignore nodes without hotspots
      const node = allSensorNodes.find(n => n.node_id === nodeId)
      if (!node?.hotspot_details) return acc

      // Keep only the newest classification (by actual timestamp, not id)
      if (
        !acc[nodeId] ||
        new Date(waste.timestamp).getTime() > new Date(acc[nodeId].timestamp).getTime()
      ) {
        acc[nodeId] = waste
      }

      return acc
    }, {} as Record<number, WasteClassification>)
  )


  const rankedWaste = [...latestWastePerNode].sort((a, b) => {
    const clogA = getLatestClogPct(a.node_details.node_id).clogPct ?? -1
    const clogB = getLatestClogPct(b.node_details.node_id).clogPct ?? -1
    return clogB - clogA
  })
  
  const priorityQueue = rankedWaste.map((waste, index) => {
    const pct = getLatestClogPct(waste.node_details.node_id).clogPct
    const rankInfo = getClogRankLevel(pct)

    return {
      rank: index + 1,
      barangay: waste.node_details.barangay_details.barangay_name,
      node_name: waste.node_details.node_name,
      pct,
      label: rankInfo.label,
      action: rankInfo.action,
    }
  })

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

  const fetchReadings = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/sensor-readings/`)
      if (!res.ok) throw new Error()
        const data = await res.json()
      setAllReadings(data.results ?? data)
    } catch {}
  }
  useEffect(() => {
    fetchReadings()
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
  const criticalAreas = allReadings.filter(n => n.reading_status === 'Critical').length
  const totalWaste = allWasteClassification.length
  const clearedAreas = allClogs.filter(c => c.status === 'Cleared').length

  const latestReadingMap = allReadings.reduce((acc, reading) => {
    const nodeId = reading.node_details.node_id

    if (
      !acc[nodeId] ||
      new Date(reading.timestamp) > new Date(acc[nodeId].timestamp)
    ) {
      acc[nodeId] = reading
    }

    return acc
  }, {} as Record<number, SensorReadings>)

  console.log(allReadings)
  console.log(latestReadingMap)

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* total cards */}
        <div className="flex justify-between w-full text-[#122A48]">
          {[
          { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: totalSensorNodes, label: "Total Sensor Nodes" },
          { icon: <Trash2 size={20} color="#122A48" />, bg: "bg-[#CDE3DE]", count: totalWaste, label: "Total Waste (kg)" },
          { icon: <TriangleAlert size={20} color="#D81010" />, bg: "bg-[#FFE5E5]", count: criticalAreas, label: "Critical Areas" },
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
          <div className="flex gap-3 text-[#122A48] mt-2 h-70">
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
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-15">
                        ...
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((node) => {
                      const latestReading = latestReadingMap[node.node_id]
                      const clogPct = getLatestClogPct(node.node_id).clogPct
                      const clogSeverity = getClogSeverity(clogPct)

                      return (
                        <TableRow key={node.node_id}>
                          <TableCell className="text-center text-xs">
                            {node.node_id}
                          </TableCell>

                          <TableCell className="text-center text-xs">
                            {node.node_name}
                          </TableCell>

                          <TableCell className="text-center text-xs">
                            {node.barangay_details?.barangay_name ?? "—"}
                          </TableCell>

                          <TableCell className="text-center text-xs">
                            <span
                              className={`text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${clogSeverity.textClass}`}
                            >
                              {clogSeverity.label}
                            </span>
                          </TableCell>

                          <TableCell className="text-center text-xs">
                            {latestReading
                              ? new Date(latestReading.timestamp).toLocaleString("en-PH", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: true,
                                })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })
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
                    <TableHead className="text-[#727272] text-center text-xs">CLOG SEVERITY INDEX</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-sm">
                            Failed to load trash accumulation. Please try again later.
                          </p>

                          <Button
                            onClick={fetchWaste}
                            className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                          >
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rankedWaste.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-[#727272] py-20"
                      >
                        No waste classification data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rankedWaste.map((waste, index) => {
                      const clogPct = getLatestClogPct(waste.node_details.node_id).clogPct
                      const rankInfo = getClogRankLevel(clogPct)

                      return (
                        <TableRow
                          key={waste.classification_id}
                          className="border-b-0"
                        >
                          {/* Rank */}
                          <TableCell className="text-center text-xs">
                            {index + 1}
                          </TableCell>

                          {/* Barangay */}
                          <TableCell className="text-center text-xs">
                            {
                              waste.node_details.hotspot_details?.name
                            }
                          </TableCell>

                          {/* Severity Index */}
                          <TableCell className="flex justify-center">
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-3 rounded-full border border-[#64748B] overflow-hidden bg-[#E5E7EB]">
                                <div
                                  className={`${rankInfo.color} h-full rounded-full`}
                                  style={{
                                    width: `${clogPct ?? 0}%`
                                  }}
                                />
                              </div>

                              <span className="text-xs min-w-[40px]">
                                {clogPct === null ? "—" : `${Math.round(clogPct)}%`}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              <div className="border-t px-4 py-2 mt-30">
                <div className="flex flex-wrap justify-center gap-3 text-[10px] text-[#122A48]">
                  <div className="flex flex-col items-center">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#E85656]" />
                      <span>80% - 100%</span>
                    </div>
                    <div>
                      <p>Critical</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#F39600]" />
                      <span>60% - 79%</span>
                    </div>
                    <div>
                      <p>High</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FFCC00]" />
                      <span>30% - 59%</span>
                    </div>
                    <div>
                      <p>Medium</p>
                    </div>
                  </div>

                  <div className="flex items-center flex-col">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#2C7B3C]" />
                      <span>0% - 29%</span>
                    </div>
                    <div>
                      <p>Low</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* priority */}
          <div className="rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] bg-[#FAFCFD] flex flex-col flex-1">
  
            <div className="p-2 border-b">
              <p className="font-bold text-sm">PRIORITY DEPLOYMENT QUEUE</p>
              <p className="text-xs text-[#727272]">
                Based on trash accumulation severity.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {priorityQueue.map(item => (
                <div key={item.rank} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                  
                  <div className="flex items-center gap-3">
                    
                    {/* rank badge */}
                    <div className="w-6 h-6 flex items-center justify-center rounded-md bg-[#E5E7EB] text-[10px] font-bold">
                      {item.rank}
                    </div>

                    {/* info */}
                    <div>
                      <p className="text-xs font-semibold">
                        {item.node_name}
                      </p>
                      <p className="text-[11px] text-[#727272]">
                        {item.barangay}
                      </p>
                      <p className="text-[11px]">
                        Severity: {item.pct === null ? "—" : `${item.pct}%`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      item.label === "CRITICAL"
                        ? "bg-[#FFE5E5] text-[#D81010]"
                        : item.label === "HIGH"
                        ? "bg-[#FFF3D6] text-[#F59E0B]"
                        : item.label === "MEDIUM"
                        ? "bg-[#FEF9C3] text-[#A16207]"
                        : item.label === "UNKNOWN"
                        ? "bg-[#E5E7EB] text-[#6B7280]"
                        : "bg-[#DCFCE7] text-[#166534]"
                    }`}>
                      {item.label}
                    </span>

                    <p className={`text-[10px] font-semibold ${
                      item.label === "CRITICAL"
                        ? "text-[#D81010]"
                        : item.label === "HIGH"
                        ? "text-[#F59E0B]"
                        : item.label === "MEDIUM"
                        ? "text-[#A16207]"
                        : item.label === "UNKNOWN"
                        ? "text-[#6B7280]"
                        : "text-[#16A34A]"
                    }`}>
                      {item.action}
                    </p>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>

        {/* all waste hotspots */}
        <div className="mt-2 bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg h-62 ">
          <div className="flex gap-2 w-full p-3 items-center">
            <p className="font-bold text-sm">WASTE HOTSPOTS</p> <p className="text-[11px]">&#40;DETAILED LIST&#41;</p>
          </div>
          <Table>
              <TableHeader className="bg-[#CFD8D] border">
              <TableRow>
                  <TableHead className="text-center text-xs text-[#727272]">NODE</TableHead>
                  <TableHead className="text-center text-xs text-[#727272]">LOCATION</TableHead>
                  <TableHead className="text-center text-xs text-[#727272]">CLOG SEVERITY INDEX</TableHead>
                  <TableHead className="text-center text-xs text-[#727272]">TRASH VOLUME (kg)</TableHead>
                  <TableHead className="text-center text-xs text-[#727272]">STATUS</TableHead>
                  <TableHead className="text-center text-xs text-[#727272]">LAST UPDATED</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-sm">
                            Failed to load waste hotspots. Please try again later.
                          </p>

                          <Button
                            onClick={fetchWaste}
                            className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                          >
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : rankedWaste.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-[#727272] py-20"
                      >
                        No waste hotspots data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rankedWaste.map((waste, index) => {
                      const { clogPct, latestReading } = getLatestClogPct(waste.node_details.node_id)
                      const clogSeverity = getClogSeverity(clogPct)

                      return (
                        <TableRow
                          key={waste.classification_id}
                          className="border-b-0"
                        >

                          
                          {/* Rank */}
                          <TableCell className="text-center text-xs">
                            {waste.node_details.node_id}
                          </TableCell>

                          {/* Barangay */}
                          <TableCell className="text-center text-xs">
                            {
                              waste.node_details
                                .barangay_details
                                .barangay_name
                            }
                          </TableCell>

                          {/* Severity Index (clog_pct based) */}
                          <TableCell className="flex justify-center">
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-3 rounded-full border border-[#64748B] overflow-hidden bg-[#E5E7EB]">
                                <div
                                  className={`${clogSeverity.barColor} h-full rounded-full`}
                                  style={{
                                    width: `${clogPct ?? 0}%`
                                  }}
                                />
                              </div>

                              <span className="text-xs min-w-[40px]">
                                {clogPct === null ? "—" : `${Math.round(clogPct)}%`}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center text-xs">
                            {waste.estimated_volume.toFixed(2)} kg
                          </TableCell>

                          {/* Status — derived from the same clog_pct as the Severity Index above,
                              so the two columns can never disagree in the same row. */}
                          <TableCell className="text-center text-xs">
                            <span className={`text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${clogSeverity.textClass}`}>
                              {clogSeverity.label}
                            </span>
                          </TableCell>

                          <TableCell className="text-center text-xs">
                            {latestReading
                              ? new Date(latestReading.timestamp).toLocaleString("en-PH", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: true,
                                })
                              : "—"}
                          </TableCell>
                          
                            


                        </TableRow>
                      )
                    })
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

        {/* recommend resource allocation
        <div className="rounded-lg bg-[#FAFCFD] border border-[#C6C6C8] p-3 mt-2">

          div
          
        </div> */}


      </div>
    
    </>
  )
}