import { logout, ACCOUNT_INACTIVE_MESSAGE, shouldSuppressInactiveRedirect } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const SERVER_UNREACHABLE_MESSAGE =
  'Cannot connect to the server. Please check your connection and try again.'

async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options)
  } catch {
    throw { error: SERVER_UNREACHABLE_MESSAGE }
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

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (!res.ok) {
      await logout()
      window.location.href = '/login'
      return false
    }
    return true
  } catch {
    await logout()
    window.location.href = '/login'
    return false
  }
}

function buildHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' }
}

// fetch with auto retry on 401
async function fetchWithRefresh(url: string, options: RequestInit): Promise<Response> {
  let res = await safeFetch(url, options)

  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) throw { detail: 'Session expired.' }
    res = await safeFetch(url, options)
  }

  if (res.status === 403) {
    const clone = res.clone()
    try {
      const body = await clone.json()
      if (body?.detail === ACCOUNT_INACTIVE_MESSAGE) {
        await logout()
        window.location.href = '/login?reason=inactive'
      }
    } catch {
      
    }
  }

  return res
}

export const api = {
  post: async (endpoint: string, data?: unknown) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },

  get: async (endpoint: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: buildHeaders(),
      credentials: 'include',
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },

  put: async (endpoint: string, data?: unknown) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },

  patch: async (endpoint: string, data?: unknown) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },

  delete: async (endpoint: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders(),
      credentials: 'include',
    })
    if (!res.ok) {
      const result = await safeJson(res)
      throw result
    }
    return true
  },
}

export const publicApi = {
  post: async (endpoint: string, data?: unknown) => {
    const res = await safeFetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const result = await safeJson(res)
    if (!res.ok) throw result
    return result
  },
}