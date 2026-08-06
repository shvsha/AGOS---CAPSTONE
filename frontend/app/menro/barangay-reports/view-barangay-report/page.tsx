"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// icons
import { ArrowLeft, CheckCircle2, FileText, Image as ImageIcon } from "lucide-react"

// shadcn
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

// components
import { DialogModal } from "@/components/DialogModal"
import { Toast } from "@/components/Toast"
import { useToast } from "@/components/hooks/useToast"
import { SpinnerIcon } from "@/components/SpinnerIcon"

// lib
import { api } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { DIALOG_COLOR } from "@/lib/constant"

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

const formatMonthYear = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" })

function LogoPlaceholder() {
  return (
    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#C6C6C8] flex items-center justify-center flex-shrink-0 bg-[#FAFCFD]">
      <span className="text-[9px] text-[#727272] font-semibold text-center leading-tight">LOGO</span>
    </div>
  )
}

function MRFTable({ report }: { report: BarangayMonthlyReport }) {
  const barangayName = report.barangay_details?.barangay_name ?? "—"

  return (
    <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] rounded-lg p-5">
      {/* Header block with logos */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <LogoPlaceholder />
        <div className="text-center">
          <p className="text-sm text-[#122A48]">Republic of the Philippines</p>
          <p className="text-sm text-[#122A48]">Province of La Union</p>
          <p className="text-sm text-[#122A48]">Municipality Of Rosario</p>
          <p className="text-sm font-bold text-[#122A48]">Barangay {barangayName}</p>
        </div>
        <LogoPlaceholder />
      </div>

      <div className="border-t-2 border-[#122A48] w-full my-3" />

      <div className="text-center mb-6">
        <p className="font-bold text-[#122A48] text-base">Municipal Environmental and Natural Resources Office</p>
        <p className="text-[#122A48] text-sm mt-1">Monthly Material Recovery Facility (MRF) Monitoring Waste Generation</p>
      </div>

      <div className="mb-3 text-sm text-[#122A48]">
        <p><span className="font-semibold">Barangay:</span> {barangayName.toUpperCase()}</p>
        <p><span className="font-semibold">For the Month of:</span> {formatMonthYear(report.report_month)}</p>
      </div>

      <Table className="border-collapse border border-[#122A48] text-xs">
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className="border border-[#122A48] text-center p-2 w-20 align-middle text-[#122A48] font-semibold">Date</TableHead>
            <TableHead colSpan={2} className="border border-[#122A48] p-2 text-center align-middle text-[#122A48] font-semibold">Recyclables (in Kg)</TableHead>
            <TableHead rowSpan={2} className="border border-[#122A48] p-2 w-32 align-middle text-[#122A48] font-semibold">
              Biodegradable Waste (in kg)
              <div className="font-normal text-[10px] mt-1">Dried Leaves and other materials <br /> put  in the composting facility</div>
            </TableHead>
            <TableHead rowSpan={2} className="border border-[#122A48] p-2 w-32 align-middle text-[#122A48] font-semibold">
              Residual Waste (kg) Waste <br /> Collected by LGU
              <div className="font-normal text-[10px] mt-1">(Basurang wala ng pakinabang)</div>
            </TableHead>
            <TableHead rowSpan={2} className="border border-[#122A48] p-2 w-40 align-middle text-[#122A48] font-semibold">
              Special Waste (kg)
              <div className="font-normal text-[10px] mt-1">
                (Used Face-mask/Shield) <br /> (All used mask and Shield should <br /> be placed in separate plastic, <br /> sealed and stored in a drum with <br />cover temporarily in the barangay <br /> for future collection)
              </div>
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="border border-[#122A48] p-2 font-normal text-[#122A48]">(Bote/Bakal/Papel/Karton)</TableHead>
            <TableHead className="border border-[#122A48] p-2 font-semibold text-[#122A48]">Amount Sold (in Php)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="border border-[#122A48] p-1 h-7"></TableCell>
            <TableCell className="border border-[#122A48] p-1 text-center">{report.recyclables_kg} kg</TableCell>
            <TableCell className="border border-[#122A48] p-1 text-center">
              {report.amount_sold ? `Php ${Number(report.amount_sold).toFixed(2)}` : "—"}
            </TableCell>
            <TableCell className="border border-[#122A48] p-1 text-center">{report.biodegradable_kg} kg</TableCell>
            <TableCell className="border border-[#122A48] p-1 text-center">{report.residual_waste_kg} kg</TableCell>
            <TableCell className="border border-[#122A48] p-1 text-center">{report.special_waste_kg ?? 0} kg</TableCell>
          </TableRow>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={`blank-${i}`}>
              <TableCell className="border border-[#122A48] p-1 h-7"></TableCell>
              <TableCell className="border border-[#122A48] p-1"></TableCell>
              <TableCell className="border border-[#122A48] p-1"></TableCell>
              <TableCell className="border border-[#122A48] p-1"></TableCell>
              <TableCell className="border border-[#122A48] p-1"></TableCell>
              <TableCell className="border border-[#122A48] p-1"></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function NarrativePhotos({ report, beforePhotos, afterPhotos, }: {
  report: BarangayMonthlyReport
  beforePhotos: ReportMedia[]
  afterPhotos: ReportMedia[]
}) {
  return (
    <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] rounded-lg p-3 h-128 overflow-y-auto">
      <p className="font-bold text-[#122A48] text-sm mb-2">Narrative Report</p>
      <p className="text-[#122A48] text-sm mb-6 whitespace-pre-wrap">{report.remarks || "No narrative report provided."}</p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="font-bold text-[#122A48] text-sm mb-2">Before Clearing</p>
          {beforePhotos.length === 0 ? (
            <p className="text-[#727272] text-xs">No photos attached.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {beforePhotos.map(m => (
                <img key={m.media} src={m.file_url ?? undefined} className="w-full h-40 object-cover rounded-lg border border-[#C6C6C8]" />
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="font-bold text-[#122A48] text-sm mb-2">After Clearing</p>
          {afterPhotos.length === 0 ? (
            <p className="text-[#727272] text-xs">No photos attached.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {afterPhotos.map(m => (
                <img key={m.media} src={m.file_url ?? undefined} className="w-full h-40 object-cover rounded-lg border border-[#C6C6C8]" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ViewBarangayReport() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [report, setReport] = useState<BarangayMonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "narrative">("details")
  const [verifyDialog, setVerifyDialog] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const { toasts, addToast, removeToast } = useToast()

  const fetchReport = async () => {
    if (!id) {
      setFetchError(true)
      setLoading(false)
      return
    }
    setLoading(true)
    setFetchError(false)
    try {
      const data = await api.get(`/api/barangay-reports/${id}/`)
      setReport(data)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [id])

  const handleVerify = async () => {
    if (!report) return
    setVerifyDialog(false)
    setVerifying(true)
    try {
      const user = getUser()
      const updated = await api.patch(`/api/barangay-reports/${report.monthly_report_id}/`, {
        status: "Reviewed",
        verified_by: user?.user_id,
      })
      setReport(prev => (prev ? { ...prev, ...updated } : updated))
      addToast("Report has been verified.", "success")
    } catch (err: any) {
      addToast(err?.detail ?? "Failed to verify report.", "error")
    } finally {
      setVerifying(false)
    }
  }

  const beforePhotos = report?.media.filter(m => m.media_category === "Before_Clearing") ?? []
  const afterPhotos = report?.media.filter(m => m.media_category === "After_Clearing") ?? []

  if (loading) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-150">
        <SpinnerIcon className="w-8 h-8 text-[#1565BC]" />
      </div>
    )
  }

  if (fetchError || !report) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-150 gap-3">
        <p className="text-[#D81010] font-semibold text-base">Failed to load this report.</p>
        <Button onClick={fetchReport} className="cursor-pointer bg-transparent rounded-lg border border-[#727272] text-[#122A48] px-3 py-2 hover:bg-gray-100">Retry</Button>
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* Sticky action bar */}
        <div className="flex justify-between items-center bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] rounded-lg px-4 py-3 mb-4 sticky top-0 z-10">
          <div className="flex items-center gap-1">
            <button onClick={() => router.push("/menro/barangay-reports")} className="cursor-pointer p-2 rounded-lg hover:bg-[#e8eef1]">
              <ArrowLeft size={18} className="text-[#122A48]" />
            </button>
            <div className="flex gap-3 items-center">
              <p className="font-bold text-[#122A48] text-sm">
                {report.barangay_details?.barangay_name} — {formatMonthYear(report.report_month)}
              </p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                report.status === "Reviewed" ? "bg-[#B2FBC173] text-[#2C7B3C]" : "bg-[#DBEAFE] text-[#1565BC]"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${report.status === "Reviewed" ? "bg-[#2C7B3C]" : "bg-[#1565BC]"}`} />
                {report.status}
              </span>
            </div>
          </div>

          {report.status === "Pending" && (
            <Button
              onClick={() => setVerifyDialog(true)}
              disabled={verifying}
              className="cursor-pointer bg-[#2fd45b] hover:bg-[#28b54e] text-white"
            >
              <CheckCircle2 size={16} className="mr-1" />
              {verifying ? "Verifying..." : "Verify Report"}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("details")}
            className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border ${
              activeTab === "details" ? "bg-[#1565BC] text-white border-[#1565BC]" : "bg-white text-[#727272] border-[#C6C6C8] hover:bg-gray-50"
            }`}
          >
            <FileText size={14} /> Report Details
          </button>
          <button
            onClick={() => setActiveTab("narrative")}
            className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border ${
              activeTab === "narrative" ? "bg-[#1565BC] text-white border-[#1565BC]" : "bg-white text-[#727272] border-[#C6C6C8] hover:bg-gray-50"
            }`}
          >
            <ImageIcon size={14} /> Narrative & Photos
          </button>
        </div>

        {activeTab === "details" ? (
          <MRFTable report={report} />
        ) : (
          <NarrativePhotos report={report} beforePhotos={beforePhotos} afterPhotos={afterPhotos} />
        )}

      </div>

      <DialogModal
        open={verifyDialog}
        onClose={() => setVerifyDialog(false)}
        onConfirm={handleVerify}
        color={DIALOG_COLOR.lightgreen}
        icon={CheckCircle2}
        iconColor={DIALOG_COLOR.green}
        title="Verify Report"
        description={<>Are you sure you want to mark this report as <strong>Reviewed</strong>? This confirms the data has been checked and finalized.</>}
        cancelLabel="Cancel"
        confirmLabel="Verify"
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}