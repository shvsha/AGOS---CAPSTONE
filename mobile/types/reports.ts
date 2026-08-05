export interface ReportMedia {
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

export interface BarangayMonthlyReport {
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
  media: ReportMedia[]
}