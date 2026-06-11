// cookie helpers

function setCookie(name: string, value: string, days=7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
}

// public api

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
  setCookie("access_token", access)
}

export const setUser = (user: object) => {
  localStorage.setItem("user", JSON.stringify(user))
  setCookie("user", JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user")
  deleteCookie("access_token")
  deleteCookie("user")
}

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("access_token")
}

export const getUserRole = (): string | null => {
  const user = getUser()
  return user ? user.user_role : null
}