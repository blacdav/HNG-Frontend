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
      const user = payload.data ?? null
      setCurrentUser(user)
      setErrorMessage('')
      return user
    } catch (error) {
      try {
        await refreshSession()
        const payload = await request('/api/auth/me', { skipRefresh: true })
        const user = payload.data ?? null
        setCurrentUser(user)
        setErrorMessage('')
        return user
      } catch (refreshError) {
        setCurrentUser(null)
        setErrorMessage(refreshError.message)
        return null
      }
    } finally {
      setCheckingAuth(false)
    }
  }

  async function logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' })
      setCurrentUser(null)
      setErrorMessage('')
      return true
    } catch (error) {
      if (error.status === 401) {
        setCurrentUser(null)
        setErrorMessage('')
        return true
      }

      setErrorMessage(error.message)
      throw error
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
