export const getAccessToken = (): string | null => {
  return sessionStorage.getItem("access_token")
}

export const getRefreshToken = (): string | null => {
  return sessionStorage.getItem("refresh_token")
}

export const getUser = () => {
  const user = sessionStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

export const setTokens = (access: string, refresh: string) => {
  sessionStorage.setItem("access_token", access)
  sessionStorage.setItem("refresh_token", refresh)
}

export const setUser = (user: object) => {
  sessionStorage.setItem("user", JSON.stringify(user))
}

export const clearAuth = () => {
  sessionStorage.removeItem("access_token")
  sessionStorage.removeItem("refresh_token")
  sessionStorage.removeItem("user")
}

export const isAuthenticated = (): boolean => {
  return !!sessionStorage.getItem("access_token")
}

export const getUserRole = (): string | null => {
  const user = getUser()
  return user ? user.user_role : null
}