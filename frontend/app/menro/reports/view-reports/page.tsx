"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// logo
import RosLogo from '@/public/ROS-logo.jpg'
import Image from "next/image"

// icons
import { ArrowLeft, FileText, FileDown } from "lucide-react"

// shadcn
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

// components
import { SpinnerIcon } from "@/components/SpinnerIcon"
import { Toast } from "@/components/Toast"
import { useToast } from "@/components/hooks/useToast"

// lib
import { api } from "@/lib/api"
import { exportPdf } from "@/lib/exportPDF"

type Barangay = {
  barangay_id: number
  barangay_name: string
}

type MunicipalReport = {
  municipal_report_id: number
  report_month: string
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

type BarangayMonthlyReport = {
  monthly_report_id: number
  bote_kg: number
  bakal_kg: number
  papel_kg: number
  plastic_kg: number
  karton_kg: number
  amount_sold: string | null
  biodegradable_kg: number
  residual_waste_kg: number
  special_waste_kg: number | null
  status: 'Draft' | 'Pending' | 'Reviewed'
  barangay_details: {
    barangay_id: number
    barangay_name: string
  } | null
}

const formatMonthYear = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" })

const monthLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long" }).toUpperCase()

function LogoPlaceholder() {
  return (
    <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FAFCFD]">
      <Image
        src={RosLogo}
        alt="AGOS Logo"
        width={90}
        height={90}
        className="rounded-full flex-shrink-0 bg-[#CDE3DE]"
      />
    </div>
  )
}

function MunicipalMRFTable({
  report,
  allBarangays,
  reportedByBarangay,
}: {
  report: MunicipalReport
  allBarangays: Barangay[]
  reportedByBarangay: Record<number, BarangayMonthlyReport>
}) {
  const sortedBarangays = [...allBarangays].sort((a, b) =>
    a.barangay_name.localeCompare(b.barangay_name)
  )

  return (
    <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] rounded-lg p-5">
      {/* Header block with logos */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <LogoPlaceholder />
        <div className="text-center">
          <p className="text-sm text-[#122A48]">Republic of the Philippines</p>
          <p className="text-sm text-[#122A48]">Province of La Union</p>
          <p className="text-sm font-bold text-[#122A48]">Municipality Of Rosario</p>
        </div>
      </div>

      <div className="border-t-2 border-[#122A48] w-full my-3" />

      <div className="text-center mb-6">
        <p className="font-bold text-[#122A48] text-base">Municipal Environmental and Natural Resources Office</p>
        <p className="text-[#122A48] text-sm mt-1">Monthly Material Recovery Facility (MRF) Monitoring Waste Generation</p>
      </div>

      <div className="mb-3 text-sm text-[#122A48]">
        <p><span className="font-semibold">For the Month of:</span> {formatMonthYear(report.report_month)}</p>
      </div>

      <Table className="border-collapse border border-[#122A48] text-xs">
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className="text-center border border-[#122A48] p-2 w-16 align-middle text-[#122A48] font-semibold">Date</TableHead>
            <TableHead rowSpan={2} className="text-center border border-[#122A48] p-2 w-28 align-middle text-[#122A48] font-semibold">Barangay</TableHead>
            <TableHead colSpan={5} className="text-center border border-[#122A48] p-2 align-middle text-[#122A48] font-semibold">
              Recyclables (in Kg)
              <div className="font-normal text-[10px] mt-1">(Bote/Bakal/Papel/Plastic/Karton)</div>
            </TableHead>
            <TableHead rowSpan={2} className="text-center border border-[#122A48] p-2 w-24 align-middle text-[#122A48] font-semibold">Amount Sold (₱)</TableHead>
            <TableHead rowSpan={2} className="text-center border border-[#122A48] p-2 w-32 align-middle text-[#122A48] font-semibold">
              Biodegradable Waste (in kg)
              <div className="font-normal text-[10px] mt-1">Dried Leaves and other materials put <br /> in the composting facility</div>
            </TableHead>
            <TableHead rowSpan={2} className="text-center border border-[#122A48] p-2 w-32 align-middle text-[#122A48] font-semibold">
              Residual Waste (kg) Waste <br /> Collected by LGU
              <div className="font-normal text-[10px] mt-1">(Basurang wala ng pakinabang)</div>
            </TableHead>
            <TableHead rowSpan={2} className="text-center border border-[#122A48] p-2 w-40 align-middle text-[#122A48] font-semibold">
              Special Waste (kg)
              <div className="font-normal text-[10px] mt-1">
                (Used Face-mask/Shield) <br /> (All used mask and Shield should <br /> be placed in separate plastic, <br /> sealed and stored in a drum with <br /> cover temporarily in the barangay <br />for future collection)
              </div>
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="border border-[#122A48] p-2 w-14 font-normal text-[#122A48]">Bote (kg)</TableHead>
            <TableHead className="border border-[#122A48] p-2 w-14 font-normal text-[#122A48]">Bakal (kg)</TableHead>
            <TableHead className="border border-[#122A48] p-2 w-14 font-normal text-[#122A48]">Papel (kg)</TableHead>
            <TableHead className="border border-[#122A48] p-2 w-14 font-normal text-[#122A48]">Plastic (kg)</TableHead>
            <TableHead className="border border-[#122A48] p-2 w-14 font-normal text-[#122A48]">Karton (kg)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBarangays.map((barangay, i) => {
            const r = reportedByBarangay[barangay.barangay_id]
            return (
              <TableRow key={barangay.barangay_id}>
                {i === 0 && (
                  <TableCell
                    rowSpan={sortedBarangays.length}
                    className="border border-[#122A48] p-3 text-center align-top font-semibold"
                  >
                    {monthLabel(report.report_month)}
                  </TableCell>
                )}
                <TableCell className="border border-[#122A48] p-3">{barangay.barangay_name}</TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">{r?.bote_kg ?? ""}</TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">{r?.bakal_kg ?? ""}</TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">{r?.papel_kg ?? ""}</TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">{r?.plastic_kg ?? ""}</TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">{r?.karton_kg ?? ""}</TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">
                  {r?.amount_sold ? `₱ ${Number(r.amount_sold).toFixed(2)}` : ""}
                </TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">{r?.biodegradable_kg ?? ""}</TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">{r?.residual_waste_kg ?? ""}</TableCell>
                <TableCell className="border border-[#122A48] p-3 text-center">{r?.special_waste_kg ?? ""}</TableCell>
              </TableRow>
            )
          })}

          {/* TOTAL row, from the municipal report's own totals */}
          <TableRow className="font-bold">
            <TableCell colSpan={2} className="border border-[#122A48] p-3 text-center">TOTAL</TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">{report.total_bote_kg}</TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">{report.total_bakal_kg}</TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">{report.total_papel_kg}</TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">{report.total_plastic_kg}</TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">{report.total_karton_kg}</TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">
              {report.total_amount_sold ? `₱ ${Number(report.total_amount_sold).toFixed(2)}` : "—"}
            </TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">{report.total_biodegradable_kg}</TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">{report.total_residual_waste_kg}</TableCell>
            <TableCell className="border border-[#122A48] p-3 text-center">{report.total_special_waste_kg ?? "—"}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

function ViewMunicipalReportInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [report, setReport] = useState<MunicipalReport | null>(null)
  const [allBarangays, setAllBarangays] = useState<Barangay[]>([])
  const [barangayReports, setBarangayReports] = useState<BarangayMonthlyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [exporting, setExporting] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const handleExport = async () => {
    if (!report) return
    setExporting(true)
    try {
      await exportPdf(
        `/api/municipal-reports/${report.municipal_report_id}/export/`,
        {},
        "municipal-mrf-report.pdf"
      )
    } catch {
      addToast("Failed to export report.", "error")
    } finally {
      setExporting(false)
    }
  }

  const fetchData = async () => {
    if (!id) {
      setFetchError(true)
      setLoading(false)
      return
    }
    setLoading(true)
    setFetchError(false)
    try {
      const municipalReport: MunicipalReport = await api.get(`/api/municipal-reports/${id}/`)

      const [barangaysData, barangayReportsData] = await Promise.all([
        api.get(`/api/barangays/all/`),
        api.get(`/api/barangay-reports/?report_month=${municipalReport.report_month}&status=Reviewed`),
      ])

      setReport(municipalReport)
      setAllBarangays(barangaysData.results ?? barangaysData)
      setBarangayReports(barangayReportsData.results ?? barangayReportsData)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  // index submitted+verified barangay reports by barangay_id for quick lookup while rendering rows
  const reportedByBarangay = barangayReports.reduce((acc, r) => {
    if (r.barangay_details) acc[r.barangay_details.barangay_id] = r
    return acc
  }, {} as Record<number, BarangayMonthlyReport>)

  if (loading) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-150">
        <SpinnerIcon size={32} color="#1565BC" />
      </div>
    )
  }

  if (fetchError || !report) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-150 gap-3">
        <p className="text-[#D81010] font-semibold text-base">Failed to load this report.</p>
        <Button onClick={fetchData} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* Sticky action bar */}
        <div className="flex justify-between items-center bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] rounded-lg px-4 py-3 mb-4 sticky top-0 z-10">
          <div className="flex items-center gap-1">
            <button onClick={() => router.push("/menro/reports")} className="cursor-pointer p-2 rounded-lg hover:bg-[#e8eef1]">
              <ArrowLeft size={18} className="text-[#122A48]" />
            </button>
            <p className="font-bold text-[#122A48] text-sm">
              Municipal Report — {formatMonthYear(report.report_month)}
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="cursor-pointer bg-[#2fd45b] hover:bg-[#28b54e] text-white"
          >
            <FileDown size={16} className="mr-1" />
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>

        <MunicipalMRFTable report={report} allBarangays={allBarangays} reportedByBarangay={reportedByBarangay} />

      </div>
      <Toast toasts={toasts} onRemove={removeToast} />

    </>
  )
}

export default function ViewMunicipalReport() {
  return (
    <Suspense fallback={null}>
      <ViewMunicipalReportInner />
    </Suspense>
  )
}