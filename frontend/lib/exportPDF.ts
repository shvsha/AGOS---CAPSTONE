import { fetchWithAuth } from "@/lib/auth"

export async function exportPdf(
  endpoint: string,
  params: Record<string, string | undefined>,
  fallbackFilename: string
) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value)
  })
  const queryString = query.toString()

  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}${queryString ? `?${queryString}` : ""}`

  const res = await fetchWithAuth(url)
  if (!res.ok) {
    throw new Error("Failed to generate PDF")
  }

  const blob = await res.blob()

  // Prefer the filename the backend set (Content-Disposition), fall back if missing
  const disposition = res.headers.get("Content-Disposition")
  const match = disposition?.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? fallbackFilename

  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
}