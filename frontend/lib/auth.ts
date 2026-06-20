"use client"

export const getAccessToken = (): string | null => {
  return localStorage.getItem("access_token")
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token")
}

export const getUser = () => {
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access)
}

export const setUser = (user: object) => {
  localStorage.setItem("user", JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user")
}

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("access_token")
}

export const getUserRole = (): string | null => {
  const user = getUser()
  return user ? user.user_role : null
}

export const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  if (res.status === 401) {
    try {
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!refreshRes.ok) {
        clearAuth()
        window.location.href = '/login'
        throw new Error('Session expired.')
      }

      const data = await refreshRes.json()
      localStorage.setItem('access_token', data.access)

      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${data.access}`,
        },
      })
    } catch {
      clearAuth()
      window.location.href = '/login'
      throw new Error('Session expired.')
    }
  }

  return res
}