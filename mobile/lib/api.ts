import * as SecureStore from 'expo-secure-store'

const BASE_URL = 'http://192.168.1.6:8000' // change this base sa wifi... do ipconfig in terminal

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

// fetch with auto retry on 401
async function fetchWithRefresh(url: string, options: RequestInit): Promise<Response> {
  let res = await fetch(url, options)

  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (!newToken) throw { detail: 'Session expired.' }

    res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
    })
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
    const result = await res.json()
    if (!res.ok) throw result
    return result
  },

  get: async (endpoint: string, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: await buildHeaders(token),
    })
    const result = await res.json()
    if (!res.ok) throw result
    return result
  },

  patch: async (endpoint: string, data?: unknown, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: await buildHeaders(token),
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw result
    return result
  },

  delete: async (endpoint: string, token?: string) => {
    const res = await fetchWithRefresh(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await buildHeaders(token),
    })
    if (!res.ok) {
      const result = await res.json()
      throw result
    }
    return true
  },
}