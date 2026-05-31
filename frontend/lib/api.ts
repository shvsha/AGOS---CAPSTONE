const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const api = {
  post: async (endpoint: string, data?: unknown, token?: string) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    })
    const result = await response.json()
    if (!response.ok) throw result
    return result
  },

  get: async (endpoint: string, token?: string) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
    })
    const result = await response.json()
    if (!response.ok) throw result
    return result
  },

  put: async (endpoint: string, data?: unknown, token?: string) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    })
    const result = await response.json()
    if (!response.ok) throw result
    return result
  },

  delete: async (endpoint: string, token?: string) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    })
    if (!response.ok) {
      const result = await response.json()
      throw result
    }
    return true
  },
}