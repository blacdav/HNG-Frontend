import { createContext, useContext, useMemo, useState } from 'react'
import { refreshSession, request } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function checkSession() {
    setCheckingAuth(true)

    try {
      const payload = await request('/api/auth/me', { skipRefresh: true })
      setCurrentUser(payload.data ?? null)
      setErrorMessage('')
    } catch (error) {
      try {
        await refreshSession()
        const payload = await request('/api/auth/me', { skipRefresh: true })
        setCurrentUser(payload.data ?? null)
        setErrorMessage('')
      } catch (refreshError) {
        setCurrentUser(null)
        setErrorMessage(refreshError.message)
      }
    } finally {
      setCheckingAuth(false)
    }
  }

  async function logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      // Clear local session state even if the backend logout endpoint is unavailable.
    } finally {
      setCurrentUser(null)
      setErrorMessage('')
    }
  }

  const value = useMemo(() => ({
    currentUser,
    checkingAuth,
    errorMessage,
    checkSession,
    logout,
    setCurrentUser,
  }), [currentUser, checkingAuth, errorMessage])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
