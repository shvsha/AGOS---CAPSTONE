export type BarangayDetails = {
  barangay_id: number
  barangay_name: string
  latitude: number
  longitude: number
  is_registered: boolean
}

export type User = {
  user_id: number
  first_name: string
  last_name: string
  email: string
  user_role: 'Admin' | 'MENRO' | 'MENRO_Staff' | 'Barangay'
  position: string | null
  barangay_id: number | null
  barangay_details: BarangayDetails | null
  status: 'Active' | 'Inactive'
  must_change_password: boolean
  created_at: string
  updated_at: string
}