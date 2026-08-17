import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import { BASE_URL, getAccessToken } from "@/lib/api"

export async function exportPdf(endpoint: string, fallbackFilename: string) {
  const token = await getAccessToken()
  const url = `${BASE_URL}${endpoint}`
  const fileUri = `${FileSystem.cacheDirectory}${fallbackFilename}`

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (result.status !== 200) {
    throw new Error("Failed to generate PDF")
  }

  // Prefer the filename the backend set (Content-Disposition), fall back if missing
  const disposition = result.headers["Content-Disposition"] ?? result.headers["content-disposition"]
  const match = disposition?.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? fallbackFilename

  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      dialogTitle: filename,
      UTI: "com.adobe.pdf",
    })
  }

  return result.uri
}