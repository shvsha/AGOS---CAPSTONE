import AsyncStorage from '@react-native-async-storage/async-storage'

export interface PhotoAsset {
  uri: string
  fileName: string
}

export interface ReportDraft {
  barangay: number
  report_month: string
  clearing_date: string | null
  recyclables_kg: number
  biodegradable_kg: number
  residual_waste_kg: number
  special_waste_kg: number
  amount_sold: string
  remarks: string
  before_photos: PhotoAsset[]
  after_photos: PhotoAsset[]
  updated_at: string
}

function draftKey(barangayId: number, reportMonth: string) {
  return `draft:${barangayId}:${reportMonth}`
}

export async function getDraft(barangayId: number, reportMonth: string): Promise<ReportDraft | null> {
  const raw = await AsyncStorage.getItem(draftKey(barangayId, reportMonth))
  return raw ? JSON.parse(raw) : null
}

export async function saveDraft(draft: ReportDraft): Promise<void> {
  const key = draftKey(draft.barangay, draft.report_month)
  await AsyncStorage.setItem(key, JSON.stringify({ ...draft, updated_at: new Date().toISOString() }))
}

export async function deleteDraft(barangayId: number, reportMonth: string): Promise<void> {
  await AsyncStorage.removeItem(draftKey(barangayId, reportMonth))
}

export async function listDrafts(): Promise<ReportDraft[]> {
  const keys = await AsyncStorage.getAllKeys()
  const draftKeys = keys.filter(k => k.startsWith('draft:'))
  const entries = await AsyncStorage.multiGet(draftKeys)
  return entries
    .map(([, value]) => (value ? JSON.parse(value) : null))
    .filter((d): d is ReportDraft => d !== null)
}