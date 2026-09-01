"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// lib
import { getUserRole, fetchWithAuth } from "@/lib/auth"
import { exportPdf } from "@/lib/exportPDF"

// shadcn
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"

// icons
import { FileDown, FileText, Eye } from "lucide-react"

// components
import { TablePagination } from "@/components/TablePagination"
import { usePagination } from "@/components/hooks/usePagination"
import { ReportsSkeleton } from "@/components/Skeleton/Menro/ReportsSkeleton"
import { usePageCache } from "@/components/hooks/usePageCache"
import { Toast } from "@/components/Toast"
import { useToast } from "@/components/hooks/useToast"
import { useFillRows } from "@/components/hooks/useFillRows"


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
}

const formatReportMonth = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" })


// fetch raw data
const fetchMunicipalReportsRaw = async (): Promise<MunicipalReport[]> => {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/municipal-reports/`)
  if (!res.ok) throw new Error()
  const data = await res.json()
  return data.results ?? data
}


export default function Reports() {
  const router = useRouter()
  
  const reportsCache = usePageCache('menroReports:municipalReports', fetchMunicipalReportsRaw, [] as MunicipalReport[], { autoFetch: false })

  const [exportingId, setExportingId] = useState<number | null>(null)
    const { toasts, addToast, removeToast } = useToast()

  const municipalReports = reportsCache.data
  const loading = reportsCache.loading
  const fetchError = reportsCache.error

  const getMonthOptions = () => {
    const months = []
    const year = new Date().getFullYear()
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
  const currentMonthValue = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue)

  const filteredReports = municipalReports
    .filter(report => report.report_month.startsWith(selectedMonth))
    .sort((a, b) => b.municipal_report_id - a.municipal_report_id)

  const { panelRef, tableWrapRef, rows } = useFillRows({
    rowHeight: 56,
    initialRows: 8,
    deps: [loading],
  })
  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filteredReports, rows)

  useEffect(() => {
    const role = getUserRole()
    if (role === "MENRO_Staff") {
      router.replace("/menro/barangay-reports")
      return
    }
    reportsCache.refetch()
  }, [])

  const handleExport = async (reportId: number) => {
    setExportingId(reportId)
    try {
      await exportPdf(`/api/municipal-reports/${reportId}/export/`, {}, "municipal-mrf-report.pdf")
    } catch {
      addToast("Failed to export report.", "error")
    } finally {
      setExportingId(null)
    }
  }

  if (loading) return <ReportsSkeleton/>


  return (
    <>
      <div className="hidden md:flex md:flex-col md:h-full">

        {/* month filter */}
        <div className="flex justify-between">
          <div className="flex gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="cursor-pointer w-40 px-3 py-3 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className='w-40 min-w-0 !max-h-70 overflow-y-auto'>
                {monthOptions.map(m => (
                  <SelectItem key={m.value} className="p-2 py-1 cursor-pointer text-[#122A48]" value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* municipal reports table */}
        <div className="flex gap-4 mt-3 flex-1 min-h-[600px]">
          <div ref={panelRef} className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col">
            <p className="p-2 px-3 text-sm font-bold text-[#122A48]">Municipal Reports</p>

            <div ref={tableWrapRef}>
              <Table>
                <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
                  <TableRow>
                    <TableHead className="font-semibold text-left text-xs text-[#727272]">REPORT ID</TableHead>
                    <TableHead className="font-semibold text-left text-xs text-[#727272]">DATE</TableHead>
                    <TableHead className="font-semibold text-left text-xs text-[#727272]">VERIFIED BY</TableHead>
                    <TableHead className="font-semibold text-left text-xs text-[#727272]">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {!fetchError && filteredReports.length > 0 &&
                    paginated.map(report => (
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
                            onClick={() => router.push(`/menro/reports/view-reports/?id=${report.municipal_report_id}`)}
                            className="text-xs border border-[#1565BC80] bg-[#CDE3DE45] hover:bg-[#b8d5cf45] text-[#122A48] cursor-pointer"
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>

                          <Button
                            onClick={() => handleExport(report.municipal_report_id)}
                            disabled={exportingId === report.municipal_report_id}
                            className="text-xs bg-[#2fd45b] hover:bg-[#28b54e] cursor-pointer"
                          >
                            <FileDown size={16} className="mr-1" />
                            {exportingId === report.municipal_report_id ? "Exporting..." : "Export PDF"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            {fetchError && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm">
                <p className="text-[#D81010] font-semibold text-xs">
                  Failed to load municipal reports. Please try again later.
                </p>

                <Button
                  onClick={() => reportsCache.refetch()}
                  className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100"
                >
                  Retry
                </Button>
              </div>
            )}

            {!fetchError && filteredReports.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm">
                <div className="rounded-full bg-[#E5E5E6] p-3">
                  <FileText size={30} color="#727272" />
                </div>

                <p className="text-[#122A48] font-bold">
                  No municipal reports found
                </p>

                <p className="text-[#727272] text-xs">
                  No municipal report has been generated for this month yet.
                </p>
              </div>
            )}

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

      </div>
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}