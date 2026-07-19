import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setTokens, clearAuth, getAccessToken, getRefreshToken } from './api'
import { User } from '../types/user'

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    const data = await api.get('/api/auth/me/')
    setUser(data)
  }

  // On app launch: if a stored token exists, validate it and load the user.
  // If it's missing/invalid, user stays null and the root layout sends them to /login.
  useEffect(() => {
    const bootstrap = async () => {
      const token = await getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        await refreshUser()
      } catch {
        await clearAuth()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    bootstrap()
  }, [])

  const login = async (email: string, password: string) => {
    const data = await api.post('/api/auth/mobile-login/', { email, password })
    await setTokens(data.access, data.refresh)
    setUser(data.user)
    return data.user as User
  }

  const logout = async () => {
    try {
      const refresh = await getRefreshToken()
      await api.post('/api/auth/mobile-logout/', { refresh })
    } catch {
      // logout should succeed locally even if the network call fails
    } finally {
      await clearAuth()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}