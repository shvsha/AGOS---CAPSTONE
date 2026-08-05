"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// lib
import { getUserRole, fetchWithAuth } from "@/lib/auth"

// shadcn
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"

// icons
import { FileDown, FileText, Eye } from "lucide-react"

// components
import { TablePagination } from "@/components/TablePagination"
import { usePagination } from "@/components/hooks/usePagination"


// types
type Barangay = {
  barangay_id: number
  barangay_name: string
  latitude: number
  longitude: number
  is_registered: boolean
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

type BarangayMonthlyReport = {
  monthly_report_id: number
  barangay: number
  municipal_report: number | null
  report_month: string
  clearing_date: string
  recyclables_kg: number
  biodegradable_kg: number
  residual_waste_kg: number
  special_waste_kg: number | null
  amount_sold: string | null
  remarks: string | null
  submitted_by: number | null
  verified_by: number | null
  submitted_at: string
  status: 'Draft' | 'Pending' | 'Reviewed'
  barangay_details: {
    barangay_id: number
    barangay_name: string
    latitude: number
    longitude: number
    is_registered: boolean
  } | null
  submitted_by_details: ReportUser | null
  verified_by_details: ReportUser | null
  media: ReportMedia[]
}

const formatReportMonth = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}


export default function BarangayReports() {
  const router = useRouter()

  // us
  const [exporting, setExporting] = useState(false)

  const [barangayReports, setBarangayReports] = useState<BarangayMonthlyReport[]>([])
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<boolean>(false)

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

  // filter state
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue)
  const [filterBarangay, setFilterBarangay] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")

  const filteredReports = barangayReports
    .filter(report =>
        report.report_month.startsWith(selectedMonth)
    )
    .filter(report =>
        filterBarangay === "All" ||
        String(report.barangay_details?.barangay_id) === filterBarangay
    )
    .filter(report =>
        filterStatus === "All" ||
        report.status === filterStatus
    )
    .sort((a, b) => b.monthly_report_id - a.monthly_report_id)

  const { paginated, currentPage, setCurrentPage, totalItems, itemsPerPage } = usePagination(filteredReports, 6)

  const fetchData = async () => {
    try {
      setLoading(true)
      setFetchError(false)

      const [barangaysRes, reportsRes] = await Promise.all([
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangays/`),
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/barangay-reports/`),
      ])

      if (!barangaysRes.ok || !reportsRes.ok) {
        throw new Error("Failed to fetch data")
      }
      const barangays = await barangaysRes.json()
      const reports = await reportsRes.json()

      setAllBarangays(barangays.results ?? barangays)
      setBarangayReports(reports.results ?? reports)

    } catch (error) {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = getUserRole()
    if (role === "MENRO") router.replace("/menro/reports")

    fetchData()
  }, [])
    


  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* top filter and export */}
        <div className="flex justify-between">
          <div className="flex gap-3">

            {/* monthly filter */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="cursor-pointer w-40 px-3 py-3 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className='w-40 min-w-0'>
                {monthOptions.map(m => (
                  <SelectItem key={m.value} className="p-2 py-1 cursor-pointer text-[#122A48]" value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* barangay filter (all barangay regardless if they are registered or not) */}
            <Select value={filterBarangay} onValueChange={setFilterBarangay}>
              <SelectTrigger className="w-40 px-3 py-2 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="All Barangays" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                <SelectItem value="All">All Barangays</SelectItem>
                {[...allBarangays]
                  .sort((a, b) =>
                    a.barangay_name.localeCompare(b.barangay_name)
                  )
                  .map((barangay) => (
                    <SelectItem
                      key={barangay.barangay_id}
                      value={String(barangay.barangay_id)}
                    >
                      {barangay.barangay_name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="cursor-pointer w-40 px-3 py-3 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="w-40 min-w-0">
                <SelectItem
                  value="All"
                  className="p-2 py-1 cursor-pointer text-[#122A48]"
                >
                  All Status
                </SelectItem>

                <SelectItem
                  value="Pending"
                  className="p-2 py-1 cursor-pointer text-[#122A48]"
                >
                  Pending
                </SelectItem>

                <SelectItem
                  value="Reviewed"
                  className="p-2 py-1 cursor-pointer text-[#122A48]"
                >
                  Reviewed
                </SelectItem>
              </SelectContent>
            </Select>



          </div>
        </div>
        
        {/* barangay reports table */}
        <div className="flex gap-4 mt-3 h-150">
          <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col">
            <p className="p-2 px-3 text-sm font-bold text-[#122A48]">Barangay Reports</p>

            <Table>
              <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
                <TableRow>
                  <TableHead className="font-semibold text-left text-xs text-[#727272]">DATE</TableHead>
                  <TableHead className="font-semibold text-left text-xs text-[#727272]">BARANGAY</TableHead>
                  <TableHead className="font-semibold text-left text-xs text-[#727272]">SUBMITTED BY</TableHead>
                  <TableHead className="font-semibold text-left text-xs text-[#727272]">STATUS</TableHead>
                  <TableHead className="font-semibold text-left text-xs text-[#727272]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                  {fetchError ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-35">
                        <div className="flex flex-col justify-center items-center gap-3 py-20">
                          <p className="text-[#D81010] font-semibold text-base">Failed to load barangay reports. Please try again later.</p>
                          <Button onClick={fetchData} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
                        </div>
                      </TableCell>
                    </TableRow>

                  ) : filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-47">
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-[#E5E5E6] p-4">
                            <FileText size={36} color="#727272" />
                          </div>
                          <p className="text-[#122A48] font-bold">No barangay reports found</p>
                          <p className="text-[#727272] text-sm">
                            No barangay reports have been submitted yet.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>

                  ) : (
                    paginated.map(reports => (
                      <TableRow key={reports.monthly_report_id} className="border-b border-[#C6C6C8] text-xs">
                        <TableCell className="text-[#122A48] text-left h-14">{formatReportMonth(reports.report_month)}</TableCell>
                        <TableCell className="text-[#122A48] text-left h-14">{reports.barangay_details?.barangay_name}</TableCell>
                        <TableCell className="text-[#122A48] text-left h-14 -mr-10">{reports.submitted_by_details?.first_name} {reports.submitted_by_details?.last_name}</TableCell>
                        <TableCell className="text-[#122A48] text-left h-14">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            reports.status
                              ? "bg-[#DBEAFE] text-[#1565BC]"
                              : "bg-[#B2FBC173] text-[#2C7B3C]"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${reports.status ? "bg-[#1565BC]" : "bg-[#2C7B3C]"}`} />
                            {reports.status ? "Pending" : "Verified"}
                          </span>
                        </TableCell>
                        <TableCell className="flex gap-3">
                            <Button 
                              onClick={() => router.push('/menro/barangay-reports/view-barangay-report/')}
                              className="text-xs border border-[#1565BC80] bg-[#CDE3DE45] hover:bg-[#b8d5cf45] text-[#122A48] cursor-pointer"
                            >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>

                          <Button disabled={exporting} className="text-xs bg-[#2fd45b] hover:bg-[#28b54e] cursor-pointer">
                            <FileDown size={16} className="mr-1" />
                            {exporting ? "Exporting..." : "Export PDF"}
                          </Button>
                          
                        </TableCell>


                      </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>

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
    </>
  )
}

