"use client"

// components
import { SearchFilter } from "@/components/SearchFilter"
import ReportProgressBar from "@/components/MonthlyReportProgressBar"
import { fetchWithAuth } from "@/lib/auth"

// react
import { useState, useEffect, useMemo, useRef } from "react"

// icons
import { Calendar as CalendarIcon, Share, Grid2x2, Leaf, Recycle, Trash2, Blocks, Radar  } from "lucide-react"

// table pagination
import { usePagination } from "@/components/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

// shadcn
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]


type BarangayReports = {
  monthly_report_id: number
  barangay_details: {
    barangay_id: number
    barangay_name: string
  }
  municipal_details: {
    municipal_id: number
  }
  report_month: string
  clearing_date: string
  recyclables_kg: number
  biodegradable_kg: number
  residual_waste_kg: number
  special_waste_kg: number
  amount_sold: number
  submitted_by: string
  verified_by: string
  submitted_at: string
  status: string
}


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

  // data states
  const [barangayReports, setBarangayReports] = useState<BarangayReports[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  function getFilteredBarangayReports(
    barangay_reports: BarangayReports[],
    barangay: string,
    selectedMonth: number | null,
    selectedYear: number | null,
    search: string
  ) {
    const q = search.toLowerCase()
    const monthYearLabel = selectedMonth !== null && selectedYear !== null
      ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
      : null

    return barangay_reports
      .filter(b => barangay === "All Barangay" || b.barangay_details?.barangay_name === barangay)
      .filter(b => monthYearLabel === null || b.report_month === monthYearLabel)
      .filter(b =>
        [b.barangay_details?.barangay_name]
          .some(field => field?.toLowerCase().includes(q))
      )
      .sort((a, b) => b.monthly_report_id - a.monthly_report_id)
  }

  const filtered = getFilteredBarangayReports(barangayReports, barangay, selectedMonth, selectedYear, search)
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, 4)

  // summary cards
  const total    = barangayReports.length
  const totalRecyclable = barangayReports.reduce((sum, r) => sum + r.recyclables_kg, 0)
  const totalBiodegredable  = barangayReports.reduce((sum, r) => sum + r.biodegradable_kg, 0)
  const totalResidualOthers   = barangayReports.reduce((sum, r) => sum + r.residual_waste_kg + r.special_waste_kg, 0)

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

  // fetch data
  const fetchBarangayReports = async () => {
    setLoading(true)
    setFetchError(false)

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangay-reports/`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setBarangayReports(data.results ?? data)
    } catch {}
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

        </div>

         {/* summary cards */}
          <div className="flex justify-between w-full text-[#122A48] mt-3">
            {[
              { icon: <Trash2 size={20} color="#D48A00" />, bg: "bg-[#EED7AA]", count: total,    label: "Total Barangay Reports" },
              { icon: <Recycle   size={20} color="#582579" />, bg: "bg-[#E1CDE3]", count: totalRecyclable,  label: "Total Recyclable" },
              { icon: <Leaf size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: totalBiodegredable, label: "Total Biodegradable"   },
              { icon: <Blocks      size={20} color="#1565BC" />, bg: "bg-[#1565BC61]", count: totalResidualOthers,  label: "Total Residual/Others"  },
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

          {/* monthly report progress */}
          <div className="mt-2 flex gap-2 w-full">
            <div className="w-250">
              <ReportProgressBar
                reports={barangayReports}
                month="May 2026"
              />
            </div>

            <div className="bg-[#58D07159] rounded-lg flex justify-center flex-1">
              <div className="flex gap-4.5 items-center">
                <CalendarIcon color={'#2C7B3C'} size={32} />
                <div>
                  <p className="text-sm font-semibold text-[#2C7B3C]">Reporting Period</p>
                  <p className="text-sm text-[#5BAD6C]">May 1 - 31, 2026</p>
                </div>
              </div>

            </div>
          </div>

          {/* table */}
          <div className='mt-2 bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] h-100 rounded-lg flex flex-col'>
            <Table>
              <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC] h-12 rounded-lg'>
                <TableRow>
                  <TableHead className='font-semibold text-center text-[#727272]'>REPORT MONTH</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>LOCATION</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>RECYCLABLE (kg)</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>BIODEGRADABLE (kg)</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>RESIDUAL (kg)</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>SPECIAL WASTE(kg)</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>AMOUNT SOLD</TableHead>
                  <TableHead className='font-semibold text-center text-[#727272]'>STATUS</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* fetch error state */}
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-15">
                        <div className="flex flex-col justify-center items-center gap-3 py-25">
                          <p className="text-[#D81010] font-semibold text-base">Failed to barangay monthly reports. Please try again later.</p>
                          <Button onClick={fetchBarangayReports} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  
                  // no node state
                  ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-25">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-[#E5E5E6] p-4">
                          <Radar size={36} color="#727272" />
                        </div>
                        <p className="text-[#122A48] font-bold">No barangay monthly reports in the system</p>
                        <p className="text-[#727272] text-sm">
                          No barangay monthly reports have been submitted yet.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                
                  // with clog event states
                  ) : (
                    paginated.map(reports => (
                      <TableRow key={reports.monthly_report_id}>
                        <TableCell className="text-[#122A48] text-center h-18">{reports.report_month}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{reports.barangay_details.barangay_name}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{reports.recyclables_kg}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{reports.biodegradable_kg}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{reports.residual_waste_kg}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{reports.special_waste_kg}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">{reports.amount_sold}</TableCell>
                        <TableCell className="text-[#122A48] text-center h-18">
                          <span className={`inline-flex items-center px-5 py-1 rounded-full text-[13px] font-semibold ${
                            reports.status === 'Pending'   ? 'bg-[#F4E4A7] text-[#E4B600]' :
                            'bg-[#B2FBC173] text-[#2C7B3C]'
                          }`}>
                            {reports.status}
                          </span>
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