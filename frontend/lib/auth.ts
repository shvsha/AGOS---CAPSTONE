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
  localStorage.setItem("refresh_token", refresh)
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