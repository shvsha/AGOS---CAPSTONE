"use client"

type MonthlyReports = {
  monthly_report_id: number
  report_month: string
  status: string
  barangay: number
  barangay_details: {
    barangay_id: number
    barangay_name: string
  } | null
}

type Props = {
  reports: MonthlyReports[]
  totalBarangays: number
  month?: string
}

export default function ReportProgressBar({ reports, totalBarangays, month }: Props) {
  const verified = reports.length
  const notSubmitted = Math.max(0, totalBarangays - verified)

  const completionPct = totalBarangays > 0 ? Math.round((verified / totalBarangays) * 100) : 0
  const verifiedPct = totalBarangays > 0 ? (verified / totalBarangays) * 100 : 0
  const notSubmittedPct = totalBarangays > 0 ? (notSubmitted / totalBarangays) * 100 : 0

  const displayMonth = month ?? new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const legend = [
    { dot: "bg-[#2C7B3C]", count: verified, label: "Verified", sub: "Reports verified" },
    { dot: "bg-[#C0392B]", count: notSubmitted, label: "Not submitted", sub: "No verified report yet" },
  ]

  return (
    <div className="bg-[#FAFCFD] border border-[#C2C1C1] rounded-lg p-4 flex flex-col gap-4">

      {/* Title */}
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm text-[#122A48]">{displayMonth} Reporting Progress</p>
      </div>

      {/* Progress bar + Completion % */}
      <div className="flex -mt-2">
        <div className="flex w-full h-3 rounded-full overflow-hidden">
          <div className="bg-[#2C7B3C] h-full transition-all duration-500" style={{ width: `${verifiedPct}%` }} />
          <div className="bg-[#C0392B] h-full transition-all duration-500" style={{ width: `${notSubmittedPct}%` }} />
        </div>
        <div className="flex flex-col items-center -mt-5">
          <span className="text-xl font-bold text-[#122A48]">{completionPct}%</span>
          <span className="text-[10px] text-center text-[#5A6A7A]">Overall Completion</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center -mt-10 mr-25 -mb-3">
        {legend.map((item, i) => (
          <div key={item.label} className="flex items-center flex-1">
            {i > 0 && <div className="w-px h-8 bg-[#C6C6C8] shrink-0 mr-4" />}
            <div className="flex items-center gap-2 flex-1 justify-center">
              <div className="flex flex-col mt-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                <span>&nbsp;</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-[#122A48]">{item.count}&nbsp;{item.label}</span>
                <span className="text-[11px] text-[#5A6A7A]">{item.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}