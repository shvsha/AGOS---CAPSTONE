"use client"

// components
import { SearchFilter } from "@/components/SearchFilter"
import ReportProgressBar from "@/components/MonthlyReportProgressBar"
import { BarangayReportsSkeleton } from "@/components/Skeleton/Admin/HistorySkeleton/BarangayReportsSkeleton"
import { usePageCache } from "@/components/hooks/usePageCache"
import { Toast } from "@/components/Toast"
import { useToast } from "@/components/hooks/useToast"
import { useFillRows } from "@/components/hooks/useFillRows"

// react
import { useState, useEffect, useCallback} from "react"
import { useRouter } from "next/navigation"

// icons
import { Calendar as CalendarIcon, Share, Leaf, Recycle, Blocks, Radar, Eye, FileDown, Trash2 } from "lucide-react"

// table pagination
import { usePagination } from "@/components/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

// shadcn
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

// lib
import { fetchWithAuth } from "@/lib/auth"
import { exportPdf } from "@/lib/exportPDF"


const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

type Barangay = {
  barangay_id: number
  barangay_name: string
}

type ReportMedia = {
  media: number
  monthly_report: number | null
  clog_event_id: number | null
  media_category: 'Before_Clearing' | 'After_Clearing'
  file_path: string | null
  file_url: string | null
  media_type: 'Image' | 'Video'
  uploaded_at: string
  uploaded_by: number | null
}

type ReportUser = {
  user_id: number
  first_name: string
  last_name: string
  position: string
}

type BarangayReports = {
  monthly_report_id: number
  barangay: number
  municipal_report: number | null
  report_month: string
  clearing_date: string
  bote_kg: number
  bakal_kg: number
  papel_kg: number
  plastic_kg: number
  karton_kg: number
  recyclables_kg: number
  biodegradable_kg: number
  residual_waste_kg: number
  special_waste_kg: number
  amount_sold: number
  remarks: string | null
  submitted_by: number | null
  verified_by: number | null
  submitted_at: string
  status: 'Draft' | 'Pending' | 'Reviewed'
  barangay_details: {
    barangay_id: number
    barangay_name: string
  } | null
  submitted_by_details: ReportUser | null
  verified_by_details: ReportUser | null
  media: ReportMedia[]
}

// fetch raw data
const fetchAllBarangaysRaw = async (): Promise<Barangay[]> => {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangays/all/`)
  if (!res.ok) throw new Error()
  const data = await res.json()
  return data.results ?? data
}

const fetchBarangayReportsRaw = async (): Promise<BarangayReports[]> => {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangay-reports/?status=Reviewed`)
  if (!res.ok) throw new Error()
  const data = await res.json()
  return data.results ?? data
}


const formatReportMonth = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" })

export default function BarangayReports() {
  const router = useRouter()

  // filter states
  const [search, setSearch] = useState<string>('')
  const [filterBarangay, setFilterBarangay] = useState<string>('All')
  const barangaysCache = usePageCache('barangayReports:barangays', fetchAllBarangaysRaw, [] as Barangay[], { autoFetch: false })
  const allBarangays = barangaysCache.data

  const [exportingId, setExportingId] = useState<number | null>(null)
  const { toasts, addToast, removeToast } = useToast()

  // Month/Year filter state
  const now = new Date()
  const getMonthOptions = () => {
    const months = []
    const year = now.getFullYear()
    for (let m = 0; m < 12; m++) {
      const d = new Date(year, m, 1)
      months.push({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      })
    }
    return months
  }
  const monthOptions = getMonthOptions()
  const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue)

  // data states
  const reportsCache = usePageCache('barangayReports:reports', fetchBarangayReportsRaw, [] as BarangayReports[], { autoFetch: false })
  const barangayReports = reportsCache.data
  const loading = barangaysCache.loading || reportsCache.loading
  const fetchError = barangaysCache.error || reportsCache.error

  function getFilteredBarangayReports(
    barangay_reports: BarangayReports[],
    filterBarangay: string,
    selectedMonth: string,
    search: string
  ) {
    const q = search.toLowerCase()
    return barangay_reports
      .filter(b => filterBarangay === "All" || String(b.barangay_details?.barangay_id) === filterBarangay)
      .filter(b => b.report_month.startsWith(selectedMonth))
      .filter(b =>
        [b.barangay_details?.barangay_name]
          .some(field => field?.toLowerCase().includes(q))
      )
      .sort((a, b) => b.monthly_report_id - a.monthly_report_id)
  }

  const filtered = getFilteredBarangayReports(barangayReports, filterBarangay, selectedMonth, search)

  const { panelRef, tableWrapRef, rows } = useFillRows({
    rowHeight: 56,
    initialRows: 5,
    deps: [loading],
  })
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filtered, rows)

  // summary cards
  const total = barangayReports.length
  const totalRecyclable = barangayReports.reduce((sum, r) => sum + r.recyclables_kg, 0)
  const totalBiodegredable = barangayReports.reduce((sum, r) => sum + r.biodegradable_kg, 0)
  const totalResidualOthers = barangayReports.reduce((sum, r) => sum + r.residual_waste_kg + r.special_waste_kg, 0)

  const refetchAll = useCallback(async () => {
    await Promise.allSettled([
      barangaysCache.refetch(),
      reportsCache.refetch(),
    ])
  }, [])

  useEffect(() => {
    refetchAll()
  }, [])

  const handleExport = async (reportId: number) => {
    setExportingId(reportId)
    try {
      await exportPdf(`/api/barangay-reports/${reportId}/export/`, {}, "barangay-mrf-report.pdf")
    } catch {
      addToast("Failed to export report.", "error")
    } finally {
      setExportingId(null)
    }
  }


  if (loading) return <BarangayReportsSkeleton/>

  return (
    <>
      <div className="hidden md:flex md:flex-col md:h-full">
        <div className="flex justify-between">
          <div className="flex gap-3">
            {/* search */}
            <SearchFilter value={search} onChange={setSearch} placeholder='Search...' height="h-9" />

            {/* barangay filter (all barangay regardless if registered or not) */}
            <Select value={filterBarangay} onValueChange={setFilterBarangay}>
              <SelectTrigger className="text-xs cursor-pointer w-40 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                <SelectItem value="All" className="p-2 text-[#122A48] text-xs cursor-pointer ">All Barangays</SelectItem>
                {[...allBarangays]
                  .sort((a, b) => a.barangay_name.localeCompare(b.barangay_name))
                  .map(b => (
                    <SelectItem key={b.barangay_id} value={String(b.barangay_id)} className="text-xs cursor-pointer p-2 text-[#122A48]">
                      {b.barangay_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* month/year filter */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="cursor-pointer text-xs w-40 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="cursor-pointer text-xs p-2 w-40 min-w-0 !max-h-70 overflow-y-auto">
                {monthOptions.map(m => (
                  <SelectItem key={m.value} className="cursor-pointer text-xs p-2 cursor-pointer text-[#122A48]" value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full text-[#122A48] mt-2">
          {[
            { icon: <Trash2 size={20} color="#D48A00" />, bg: "bg-[#EED7AA]", count: total, label: "Total Barangay Reports" },
            { icon: <Recycle size={20} color="#582579" />, bg: "bg-[#E1CDE3]", count: totalRecyclable, label: "Total Recyclable (kg)" },
            { icon: <Leaf size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: totalBiodegredable, label: "Total Biodegradable (kg)" },
            { icon: <Blocks size={20} color="#1565BC" />, bg: "bg-[#1565BC61]", count: totalResidualOthers, label: "Total Residual/Others (kg)" },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-17 min-[2560px]:h-20 min-[3840px]:h-24 w-full flex items-center p-3 gap-3 relative bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#122A48] leading-tight">{card.count}</span>
                <p className="text-xs text-[#122A48]">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* monthly report progress */}
        <div className="mt-2 flex gap-2 w-full">
          <div className="flex-[3]">
            <ReportProgressBar
              reports={barangayReports.filter(r => r.report_month.startsWith(selectedMonth))}
              totalBarangays={allBarangays.length}
              month={monthOptions.find(m => m.value === selectedMonth)?.label ?? selectedMonth}
            />
          </div>

          <div className="bg-[#58D07159] rounded-lg flex justify-center flex-1 min-w-[240px]">
            <div className="flex gap-4.5 items-center">
              <CalendarIcon color={'#2C7B3C'} size={32} />
              <div>
                <p className="text-sm font-semibold text-[#2C7B3C]">Reporting Period</p>
                <p className="text-sm text-[#5BAD6C]">
                  {(() => {
                    const [y, m] = selectedMonth.split('-').map(Number)
                    const lastDay = new Date(y, m, 0).getDate()
                    const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long' })
                    return `${label} 1 - ${lastDay}, ${y}`
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* table */}
        <div ref={panelRef} className='flex-1 min-h-[412px] mt-2 bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] rounded-lg flex flex-col'>
          <div ref={tableWrapRef}>
            <Table>
              <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC] h-12 rounded-lg'>
                <TableRow>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>DATE</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>BARANGAY</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>SUBMITTED BY</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>STATUS</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!fetchError && filtered.length > 0 && paginated.map(reports => (
                  <TableRow key={reports.monthly_report_id} className="border-b border-[#C6C6C8] text-xs">
                    <TableCell className="text-[#122A48] text-left h-14">{formatReportMonth(reports.report_month)}</TableCell>
                    <TableCell className="text-[#122A48] text-left h-14">{reports.barangay_details?.barangay_name}</TableCell>
                    <TableCell className="text-[#122A48] text-left h-14">{reports.submitted_by_details?.first_name} {reports.submitted_by_details?.last_name}</TableCell>
                    <TableCell className="text-[#122A48] text-left h-14">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        reports.status === "Reviewed"
                          ? "bg-[#B2FBC173] text-[#2C7B3C]"
                          : reports.status === "Pending"
                          ? "bg-[#DBEAFE] text-[#1565BC]"
                          : "bg-[#E5E5E6] text-[#727272]"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          reports.status === "Reviewed"
                            ? "bg-[#2C7B3C]"
                            : reports.status === "Pending"
                            ? "bg-[#1565BC]"
                            : "bg-[#727272]"
                        }`} />
                        {reports.status}
                      </span>
                    </TableCell>
                    <TableCell className="flex gap-3">
                      <Button
                        onClick={() => router.push(`/admin/history/barangay-reports/view-barangay-report/?id=${reports.monthly_report_id}`)}
                        className="text-xs border border-[#1565BC80] bg-[#CDE3DE45] hover:bg-[#b8d5cf45] text-[#122A48] cursor-pointer"
                      >
                        <Eye size={16} className="mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleExport(reports.monthly_report_id)}
                        disabled={exportingId === reports.monthly_report_id}
                        className="text-xs bg-[#2fd45b] hover:bg-[#28b54e] cursor-pointer"
                      >
                        <FileDown size={16} className="mr-1" />
                        {exportingId === reports.monthly_report_id ? "Exporting..." : "Export PDF"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {fetchError && (
            <div className="flex-1 flex flex-col justify-center items-center gap-3">
              <p className="text-[#D81010] font-semibold text-base">Failed to load barangay reports. Please try again later.</p>
              <Button onClick={refetchAll} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
            </div>
          )}

          {!fetchError && filtered.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm">
              <div className="rounded-full bg-[#E5E5E6] p-3">
                <Radar size={30} color="#727272" />
              </div>
              <p className="text-[#122A48] font-bold">No barangay monthly reports in the system</p>
              <p className="text-[#727272] text-xs">
                No barangay monthly reports have been submitted yet.
              </p>
            </div>
          )}

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

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}