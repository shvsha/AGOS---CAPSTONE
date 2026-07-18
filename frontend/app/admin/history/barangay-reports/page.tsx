"use client"

// components
import { SearchFilter } from "@/components/SearchFilter"

// react
import { useState, useEffect, useMemo, useRef } from "react"

// icons
import { Calendar as CalendarIcon, ChevronDown, Share, Grid2x2, Leaf, Recycle, Trash2,  } from "lucide-react"

// shadcn
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export default function BarangayReports() {
  // filter states
  const [search, setSearch] = useState<string>('')
  const [barangay, setBarangay] = useState<string>('All Barangay')
  const [allBarangays, setAllBarangays] = useState<{ barangay_id: number; barangay_name: string }[]>([])

  // Month/Year filter state
  const now = new Date()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [tempMonth, setTempMonth] = useState<number>(now.getMonth())
  const [tempYear, setTempYear] = useState<number>(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null) 
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // summary cards
  // const total    = occupiedNodes.length
  // const critical = occupiedNodes.filter(n => n.condition === 'Critical').length
  // const warning  = occupiedNodes.filter(n => n.condition === 'Warning').length
  // const normal   = occupiedNodes.filter(n => n.condition === 'Normal').length

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Reset draft values to the applied ones whenever the dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempMonth(selectedMonth ?? now.getMonth())
      setTempYear(selectedYear ?? now.getFullYear())
    }
  }, [isOpen])

  const monthYearLabel = useMemo(() => {
    if (selectedMonth === null || selectedYear === null) return "Filter by Month"
    return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
  }, [selectedMonth, selectedYear])

  const years = useMemo(() => {
    const current = now.getFullYear()
    // 5 years back, current, and 1 year forward — adjust range as needed
    return Array.from({ length: 15 }, (_, i) => current - 5 + i)
  }, [])

  const handleApply = () => {
    setSelectedMonth(tempMonth)
    setSelectedYear(tempYear)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedMonth(null)
    setSelectedYear(null)
    setIsOpen(false)
  }

  return (
    <>
      <div className="hidden md:flex flex-col">
        <div className="flex justify-between">
          <div className="flex gap-3">
            {/* search */}
            <SearchFilter value={search} onChange={setSearch} placeholder='Search...' height="h-9" />

            {/* barangay filter */}
            <Select value={barangay} onValueChange={setBarangay}>
              <SelectTrigger className="w-35 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
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

            {/* month/year filter */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2.5 w-[160px] h-9 px-3 border-2 border-[#C6C6C8] rounded-lg bg-white text-[14px] font-medium transition-colors outline-none text-left ${
                  selectedMonth !== null ? "text-[#122A48]" : "text-[#999999]"
                }`}
              >
                <span className="text-center mt-0.5">{monthYearLabel}</span>
                <CalendarIcon size={16} className="text-[#122A48] shrink-0" />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-1.5 p-4 bg-white border border-[#D0D0D0] rounded-lg shadow-xl z-50 flex flex-col gap-3 w-[240px]">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#727272] uppercase tracking-wide">Month</label>
                    <Select value={String(tempMonth)} onValueChange={(v) => setTempMonth(Number(v))}>
                      <SelectTrigger className="w-full h-9 border border-[#D0D0D0] rounded-md px-2 text-[12px] text-[#122A48]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {MONTH_NAMES.map((name, idx) => (
                          <SelectItem key={idx} value={String(idx)} className="text-[12px] text-[#122A48]">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#727272] uppercase tracking-wide">Year</label>
                    <Select value={String(tempYear)} onValueChange={(v) => setTempYear(Number(v))}>
                      <SelectTrigger className="w-full h-9 border border-[#D0D0D0] rounded-md px-2 text-[12px] text-[#122A48]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)} className="text-[12px] text-[#122A48]">
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      onClick={handleApply}
                      className="flex-1 h-8 text-[11px] font-semibold bg-[#122A48] text-white hover:bg-[#0d1f36]"
                    >
                      Apply
                    </Button>
                    {selectedMonth !== null && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="flex-1 text-center text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-dashed border-red-200 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* export */}
          <div>
            <Button className="bg-[#FAFCFD] border border-[#C6C6C8] rounded-lg px-3 py-2 text-[#122A48] text-xs cursor-pointer hover:bg-[#e8eff3]">
              <Share/>
              Export
            </Button>
          </div>

          {/* summary cards */}
          <div className="flex justify-between w-full text-[#122A48] mt-3">
            {[
              { icon: <Grid2x2 size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: total,    label: "Total Occupied Nodes" },
              { icon: <Leaf   size={20} color="#D81010" />, bg: "bg-[#FFE5E5]", count: critical,  label: "Critical Events" },
              { icon: <Recycle size={20} color="#FF9705" />, bg: "bg-[#F4E4A7]", count: warning, label: "Warning"   },
              { icon: <Trash2      size={20} color="#1868A9" />, bg: "bg-[#1868A929]", count: normal,  label: "Normal"  },
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





        </div>


      </div>
    </>
  )
}