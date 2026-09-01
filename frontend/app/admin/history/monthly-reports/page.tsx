"use client"

// react
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// components
import { SearchFilter } from "@/components/SearchFilter"
import { MonthlyReportsSkeleton } from "@/components/Skeleton/Admin/HistorySkeleton/MonthlyReportsSkeleton"
import { Toast } from "@/components/Toast"
import { useToast } from "@/components/hooks/useToast"
import { useFillRows } from "@/components/hooks/useFillRows"
import { useExportDialog } from "@/components/ExportDialog/useExportDialog"

// table pagination
import { usePagination } from "@/components/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

// shadcn
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

// lib
import { fetchWithAuth } from "@/lib/auth";
import { usePageCache } from "@/components/hooks/usePageCache"
import { exportPdf } from "@/lib/exportPDF"

// icons
import { FileText, Recycle, Leaf, Blocks, Eye, FileDown } from "lucide-react";

// fetch raw data
const fetchMunicipalReportsRaw = async (): Promise<MunicipalReport[]> => {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/municipal-reports/`)
  if (!res.ok) throw new Error()
  const data = await res.json()
  return data.results ?? data
}

// types
type ReportUser = {
  user_id: number
  first_name: string
  last_name: string
  position: string
}

type MunicipalReport = {
  municipal_report_id: number
  report_month: string
  total_barangays_reported: number
  generated_by: number | null
  generated_by_details: ReportUser | null
  generated_at: string
  total_bote_kg: number
  total_bakal_kg: number
  total_papel_kg: number
  total_plastic_kg: number
  total_karton_kg: number
  total_amount_sold: string | null
  total_biodegradable_kg: number
  total_residual_waste_kg: number
  total_special_waste_kg: number | null
}

const formatReportMonth = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" })


export default function MonthlyReports() {
  const router = useRouter()
  
  const [exportingId, setExportingId] = useState<number | null>(null)
  const { toasts, addToast, removeToast } = useToast()  

  const reportsCache = usePageCache('monthlyReports:municipalReports', fetchMunicipalReportsRaw, [] as MunicipalReport[], { autoFetch:  false })

  useEffect(() => {
    reportsCache.refetch()
  }, [])

  const municipalReports = reportsCache.data
  const loading = reportsCache.loading
  const fetchError = reportsCache.error
  
  // filter states
  const [search, setSearch] = useState<string>('')

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
  const [selectedMonth, setSelectedMonth] = useState<string>("All")

  const q = search.toLowerCase()
  const filteredReports = municipalReports
    .filter(report => selectedMonth === "All" || report.report_month.startsWith(selectedMonth))
    .sort((a, b) => b.municipal_report_id - a.municipal_report_id)
    .filter(report =>
      [report.generated_by_details?.first_name, report.generated_by_details?.last_name]
        .some(field => field?.toLowerCase().includes(q))
    )
  
  const { panelRef, tableWrapRef, rows } = useFillRows({
    rowHeight: 56,
    initialRows: 7,
    deps: [loading],
  })
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filteredReports, rows)

    // summary cards
  const total = municipalReports.length
  const totalRecyclable = municipalReports.reduce((sum, r) => sum + r.total_bote_kg + r.total_bakal_kg + r.total_karton_kg + r.total_papel_kg + r.total_plastic_kg, 0)
  const totalBiodegredable = municipalReports.reduce((sum, r) => sum + r.total_biodegradable_kg, 0)
  const totalResidualOthers = municipalReports.reduce((sum, r) => sum + r.total_residual_waste_kg + (r.total_special_waste_kg ?? 0), 0)

  const { requestExport, ExportDialogs } = useExportDialog<{ id: number; reportMonth: string }>(
    async ({ id }) => {
      try {
        await exportPdf(`/api/municipal-reports/${id}/export/`, {}, "municipal-mrf-report.pdf")
      } catch {
        addToast("Failed to export report.", "error")
      }
    },
    {
      description: ({ reportMonth }) => (
        <>Are you sure you want to export this compiled MRF report for <strong>{formatReportMonth(reportMonth)}</strong>?</>
      ),
    }
  )
  
  if (loading) return <MonthlyReportsSkeleton/>
  
  return (
    <>
      <div className="hidden md:flex md:flex-col md:h-full">
        {/* filter */}
        <div className="flex gap-2">

          {/* search filter */}
          <SearchFilter value={search} onChange={setSearch} placeholder='Search...' height="h-9" />

          {/* month/year filter */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="cursor-pointer text-xs w-40 px-3 py-4 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className=" text-xs cursor-pointer w-40 min-w-0 !max-h-70 overflow-y-auto">
              <SelectItem className="p-2 text-xs cursor-pointer text-[#122A48]" value="All">All Months</SelectItem>
              {monthOptions.map(m => (
                <SelectItem key={m.value} className="p-2 text-xs  cursor-pointer text-[#122A48]" value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {/* total cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full text-[#122A48] mt-2">
          {[
            { icon: <FileText size={20} color="#D48A00" />, bg: "bg-[#EED7AA]", count: total, label: "Total Compiled Reports" },
            { icon: <Recycle size={20} color="#582579" />, bg: "bg-[#E1CDE3]", count: totalRecyclable, label: "Total Recyclable (kg)" },
            { icon: <Leaf   size={20} color="#2C7B3C" />, bg: "bg-[#B2FBC1]", count: totalBiodegredable, label: "Total Biodegradable (kg)" },
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

        {/* table */}
        <div ref={panelRef} className='flex-1 min-h-[528px] mt-2 bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] rounded-lg flex flex-col'>
          <div ref={tableWrapRef}>
            <Table>
              <TableHeader className='bg-[#e8eef1b4] border border-[#CFD8DC] h-10 rounded-lg'>
                <TableRow>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>ID</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>DATE</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>VERIFIED BY</TableHead>
                  <TableHead className='font-semibold text-left text-xs text-[#727272]'>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!fetchError && filteredReports.length > 0 && paginated.map(report => (
                  <TableRow key={report.municipal_report_id} className="border-b border-[#C6C6C8] text-xs">
                      <TableCell className="text-[#122A48] text-left h-14">{report.municipal_report_id}</TableCell>
                      <TableCell className="text-[#122A48] text-left h-14">{formatReportMonth(report.report_month)}</TableCell>
                      <TableCell className="text-[#122A48] text-left h-14">
                        {report.generated_by_details
                          ? `${report.generated_by_details.first_name} ${report.generated_by_details.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell className="flex gap-3">
                        <Button
                          onClick={() => router.push(`/admin/history/monthly-reports/view-monthly-reports/?id=${report.municipal_report_id}`)}
                          className="text-xs border border-[#1565BC80] bg-[#CDE3DE45] hover:bg-[#b8d5cf45] text-[#122A48] cursor-pointer"
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </Button>

                        <Button
                          onClick={() =>
                            requestExport({
                              id: report.municipal_report_id,
                              reportMonth: report.report_month,
                            })
                          }
                          className="text-xs bg-[#2fd45b] hover:bg-[#28b54e] cursor-pointer"
                        >
                          <FileDown size={16} className="mr-1" />
                          Export PDF
                        </Button>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {fetchError && (
            <div className="flex-1 flex flex-col justify-center items-center gap-3">
              <p className="text-[#D81010] font-semibold text-base">Failed to load compiled barangay reports. Please try again later.</p>
              <Button onClick={() => reportsCache.refetch()} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
            </div>
          )}

          {!fetchError && filteredReports.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm">
              <div className="rounded-full bg-[#E5E5E6] p-3">
                <FileText size={30} color="#727272" />
              </div>
              <p className="text-[#122A48] font-bold">No compiled barangay monthly reports in the system</p>
              <p className="text-[#727272] text-xs">
                No compiled barangay monthly reports have been created yet.
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

      {ExportDialogs}
    </>
  )
}
