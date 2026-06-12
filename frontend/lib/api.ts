import { getAccessToken, getRefreshToken, setTokens, clearAuth } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

// silent refresh
async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  try {
    const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!res.ok) {
      clearAuth()
      window.location.href = '/login'
      return null
    }

    const data = await res.json()
    setTokens(data.access, data.refresh ?? refresh)
    return data.access
  } catch {
    clearAuth()
    window.location.href = '/login'
    return null
  }
}

// build headers
function buildHeaders(token?: string): HeadersInit {
  const t = token ?? getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(t && { Authorization: `Bearer ${t}` }),
  }
}

// fetch with auto retry on 401
async function fetchWithRefresh(url: string, options: RequestInit): Promise<Response> {
  let res = await fetch(url, options)

  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (!newToken) throw { detail: 'Session expired.' }

    // retry with new token
    res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      },
    })
  }

  return res
}

export const api = {
  post: async (endpoint: string, data?: unknown, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw result
    return result
  },

  get: async (endpoint: string, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: buildHeaders(token),
      credentials: 'include',
    })
    const result = await res.json()
    if (!res.ok) throw result
    return result
  },

  put: async (endpoint: string, data?: unknown, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw result
    return result
  },

  patch: async (endpoint: string, data?: unknown, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw result
    return result
  },

  delete: async (endpoint: string, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
      credentials: 'include',
    })
    if (!res.ok) {
      const result = await res.json()
      throw result
    }
    return true
  },
}