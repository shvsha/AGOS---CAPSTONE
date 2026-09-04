import * as SecureStore from 'expo-secure-store'
import { triggerForceLogout } from './authEvents'

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.6:8000'
export const ACCOUNT_INACTIVE_MESSAGE = 'Your account is not active. Please contact your administrator.'
export const SERVER_UNREACHABLE_MESSAGE =
  'Cannot connect to the server. Please check your connection and try again.'

export const REQUEST_TIMEOUT_MESSAGE = 'Took too long to respond. Please try again.'
const DEFAULT_TIMEOUT_MS = 30000
  
async function safeFetch(url: string, options: RequestInit, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw { error: REQUEST_TIMEOUT_MESSAGE }
    }
    throw { error: SERVER_UNREACHABLE_MESSAGE }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function safeJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw { error: `Something went wrong on the server (status ${res.status}). Please try again later.` }
  }
}

// token storage
export async function getAccessToken() {
  return SecureStore.getItemAsync('access_token')
}
export async function getRefreshToken() {
  return SecureStore.getItemAsync('refresh_token')
}
export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync('access_token', access)
  await SecureStore.setItemAsync('refresh_token', refresh)
}
export async function clearAuth() {
  await SecureStore.deleteItemAsync('access_token')
  await SecureStore.deleteItemAsync('refresh_token')
}

export const publicApi = {
  post: async (endpoint: string, data?: unknown) => {
    const res = await safeFetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },
}

// silent refresh
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refresh = await getRefreshToken()
    if (!refresh) { await clearAuth(); return null }

    const res = await fetch(`${BASE_URL}/api/auth/mobile-token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!res.ok) { await clearAuth(); return null }

    const data = await res.json()
    await SecureStore.setItemAsync('access_token', data.access)
    return data.access
  } catch {
    await clearAuth()
    return null
  }
}

// build headers
async function buildHeaders(token?: string): Promise<HeadersInit> {
  const t = token ?? (await getAccessToken())
  return {
    'Content-Type': 'application/json',
    ...(t && { Authorization: `Bearer ${t}` }),
  }
}

// fetch with auto retry
async function fetchWithRefresh(url: string, options: RequestInit): Promise<Response> {
  let res = await safeFetch(url, options)

  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (!newToken) throw { detail: 'Session expired.' }

    res = await safeFetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
    })
  }

  if (res.status === 403) {
    const clone = res.clone()
    try {
      const body = await clone.json()
      if (body?.detail === ACCOUNT_INACTIVE_MESSAGE) {
        await clearAuth()
        triggerForceLogout()
      }
    } catch {
      // not JSON, or didn't match — a normal 403, let it bubble up as-is
    }
  }

  return res
}

export const api = {
  post: async (endpoint: string, data?: unknown, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: await buildHeaders(token),
      body: JSON.stringify(data),
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },

  get: async (endpoint: string, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: await buildHeaders(token),
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },

  patch: async (endpoint: string, data?: unknown, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: await buildHeaders(token),
      body: JSON.stringify(data),
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },

  delete: async (endpoint: string, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await buildHeaders(token),
    })
    if (!res.ok) {
      const result = await safeJson(res)
      throw result
    }
    return true
  },

  upload: async (endpoint: string, formData: FormData, token?: string) => {
    const t = token ?? (await getAccessToken())
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: formData,
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },
}