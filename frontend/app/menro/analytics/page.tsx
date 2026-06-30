"use client"

// react
import { useEffect, useState } from "react"

// auth
import { fetchWithAuth } from "@/lib/auth";

// charts
import { PieChart, Pie, Cell } from "recharts"

// icons
import { Trash, Trash2, Recycle, Leaf, Biohazard, } from "lucide-react";

// shadcn
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

// components
import { usePagination } from "@/components/hooks/usePagination"
import { TablePagination } from "@/components/TablePagination"


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


export default function Analytics() {
  // waste classification state
  const [wasteClassification, setWasteClassification] = useState<WasteClassification[]>([])
  const [allBarangays, setAllBarangays] = useState<{ barangay_id: number; barangay_name: string }[]>([])
  const [allSensorNodes, setAllSensorNodes] = useState<{ node_id: number; node_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  console.log(allBarangays)

  // summary cards
  const totalWaste = wasteClassification.reduce((sum, w) => sum + (w.estimated_volume || 0), 0)
  const totalRecyclable = wasteClassification.reduce(
    (sum, w) => sum + (w.estimated_volume || 0) * (w.recyclable_pct || 0) / 100,
    0
  )
  const totalBiodegradable = wasteClassification.reduce(
    (sum, w) => sum + (w.estimated_volume || 0) * (w.biodegradable_pct || 0) / 100,
    0
  )
  const totalResidual = wasteClassification.reduce(
    (sum, w) => sum + (w.estimated_volume || 0) * (w.residual_pct || 0) / 100,
    0
  )
  const totalSpecialWaste = wasteClassification.reduce(
    (sum, w) => sum + (w.estimated_volume || 0) * (w.special_waste_pct || 0) / 100,
    0
  )

  const filtered = wasteClassification
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)

  const wasteByBarangay = allBarangays
    .map(b => {
      const total = wasteClassification
        .filter(w => w.node_details.barangay_details.barangay_id === b.barangay_id)
        .reduce((sum, w) => sum + (w.estimated_volume || 0), 0)
      return { barangay_id: b.barangay_id, barangay_name: b.barangay_name, total }
    })
    .sort((a, b) => b.total - a.total)

  const maxBarangayWaste = Math.max(...wasteByBarangay.map(b => b.total), 0)

  // waste composition percentages
  const compositionData = [
    { name: "Recyclable Waste", value: totalRecyclable, color: "#7ED99B" },
    { name: "Biodegradable Waste", value: totalBiodegradable, color: "#7CB3E8" },
    { name: "Residual Waste", value: totalResidual, color: "#E8B27C" },
    { name: "Special Waste", value: totalSpecialWaste, color: "#E87C7C" },
  ]


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
        <div className="hidden md:flex flex-col text-[#122A48]">

        <div className='w-full'>
          <p className='font-bold text-base'>Overview</p>
        </div>

        {/* total cards */}
        <div className="flex justify-between w-full text-[#122A48] gap-3 mt-1">
          {[
            { icon: <Trash size={20} color="#122A48" />, bg: "bg-[#CDE3DE]", count: totalWaste, label: "Total Waste Collected" },
            { icon: <Recycle size={20} color="#1565BC" />, bg: "bg-[#1565BC61]", count: totalRecyclable, label: "Recyclable" },
            { icon: <Leaf size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: totalBiodegradable, label: "Biodegradable" },
            { icon: <Trash2 size={20} color="#122A48CC" />, bg: "bg-[#D9D9D9]", count: totalResidual, label: "Residual" },
            { icon: <Biohazard size={20} color="#D48A00" />, bg: "bg-[#F4E4A6]", count: totalSpecialWaste, label: "Special" },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-17 w-75 flex items-center p-3 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#122A48] leading-tight">
                  {card.count.toFixed(1)} <span className="text-xs font-normal">kg</span>
                </span>
                <p className="text-xs text-[#122A48]">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          {/* collected by barangay */}
          <div className="bg-[#FAFCFD] rounded-lg border border-[#C6C6C8] w-[550px]">
            <div className="w-full p-2">
              <p className="font-bold text-sm">Collection by Barangay</p>
            </div>

            <hr/>

            <div className="flex flex-col gap-3 px-3 py-4">
              {wasteByBarangay.map(b => {
                const widthPct = maxBarangayWaste > 0 ? (b.total / maxBarangayWaste) * 100 : 0
                const displayWidthPct = b.total > 0 ? Math.max(widthPct, 4) : 30
                return (
                  <div key={b.barangay_id} className="flex items-center gap-8">
                    <span className="text-xs font-medium text-[#122A48] w-28 text-right shrink-0">
                      {b.barangay_name}
                    </span>
                    <div className="flex-1 flex items-center gap-5">
                      <div
                        className={`h-2 rounded-full ${b.total > 0 ? "bg-[#CDE3DE]" : "bg-[#E5E5E5]"}`}
                        style={{ width: `${displayWidthPct}%` }}
                      />
                      <span className="text-xs text-[#122A48] whitespace-nowrap">
                        {b.total.toFixed(1)}kg
                      </span>
                    </div>
                  </div>
                )
              })}
              {wasteByBarangay.length === 0 && (
                <div className="flex justify-center items-center h-45">
                  <p className="text-xs text-[#122A48]/60">No data yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* waste composition */}
          <div className="bg-[#FAFCFD] rounded-lg border border-[#C6C6C8] flex-1">
            <div className="w-full p-2">
              <p className="font-bold text-sm">Waste Composition</p>
            </div>

            <hr />

            <div className="flex items-center gap-6 p-4">
              <div className="relative w-40 h-40 shrink-0">
                <PieChart width={160} height={160}>
                  <Pie
                    data={compositionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {compositionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-[#122A48]">{totalWaste.toFixed(0)}</span>
                  <span className="text-xs text-[#122A48]/70">KG</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {compositionData.map(entry => {
                  const pct = totalWaste > 0 ? (entry.value / totalWaste) * 100 : 0
                  return (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs text-[#122A48]">
                        {entry.name} <span className="font-semibold">{pct.toFixed(1)}%</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* table classification waste rtecords */}
        <div className="bg-[#FAFCFD] rounded-lg border border-[#C6C6C8] mt-2">
          <div className="w-full p-2">
            <p className="font-bold text-sm">Waste Classication Readings</p>
          </div>

          <Table>
            <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC] h-12'>
              <TableRow>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>CLASSIFICATION ID</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>NODE</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>DOMINANT WASTE TYPE</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>RECYCLABLE</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>BIODEGRADABLE</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>RESIDUAL</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>SPECIAL WASTE</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>CONFIDENCE</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>ESTIMATED VOLUME</TableHead>
                <TableHead className='font-semibold text-center text-[#727272] text-xs'>TIMESTAMP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-base">Failed to load waste classifications. Please try again later.</p>
                          <Button onClick={fetchWaste} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  
                  // no node state
                  ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-33">
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
                  ) : (
                    paginated.map(w => (
                      <TableRow key={w.classification_id}>
                        <TableCell className="text-center text-xs h-10">{w.classification_id}</TableCell>
                        <TableCell className="text-center text-xs">{w.node_details?.node_name ?? "—"}</TableCell>
                        <TableCell className="text-center text-xs">{w.dominant_waste_type}</TableCell>
                        <TableCell className="text-center text-xs">{w.recyclable_pct?.toFixed(2)}%</TableCell>
                        <TableCell className="text-center text-xs">{w.biodegradable_pct?.toFixed(2)}%</TableCell>
                        <TableCell className="text-center text-xs">{w.residual_pct?.toFixed(2)}%</TableCell>
                        <TableCell className="text-center text-xs">{w.special_waste_pct?.toFixed(2)}%</TableCell>
                        <TableCell className="text-center text-xs">{(w.confidence).toFixed(2)}%</TableCell>
                        <TableCell className="text-center text-xs">{w.estimated_volume.toFixed(2)} kg</TableCell>
                        <TableCell className="text-center text-xs">
                          {new Date(w.timestamp).toLocaleString()}
                        </TableCell>
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

      </div>

    </>
  )
}

