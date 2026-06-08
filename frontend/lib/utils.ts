import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// merge tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// for otp timer
export const formatCooldown = (secs: number): string => {
  if (secs >= 3600) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h}h ${m}m ${s}s`
  }
  if (secs >= 60) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}s`
  }
  return `${secs}s`
}

export const getErrorMessage = (error: unknown): string => {
  // If error is an object (backend returned JSON error)
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>

    // Handle common backend error keys
    if (err.error) return err.error as string
    if (err.detail) return err.detail as string
    if (err.message) return err.message as string
    if (err.non_field_errors) {
      const msg = err.non_field_errors
      return Array.isArray(msg) ? msg[0] : msg as string
    }

    const firstKey = Object.keys(err)[0]
    if (firstKey) {
      const firstValue = err[firstKey]
      const fieldLabel = firstKey.charAt(0).toUpperCase() + firstKey.slice(1)
      const message = Array.isArray(firstValue) ? firstValue[0] : firstValue as string
      return `${fieldLabel}: ${message}`
    }
  }

  // If error is a plain string
  if (typeof error === "string") return error

  // True fallback — network error etc
  return "Something went wrong. Please try again."
}

