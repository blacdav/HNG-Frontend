import { useEffect, useState } from 'react'
import { buildUrl } from './api/client'
import { AuthProvider, useAuth } from './context/AuthContext'
import ClassifyPage from './pages/ClassifyPage'
import DashboardPage from './DashboardCompact'

function AppRoutes() {
  const [route, setRoute] = useState(
    ['/dashboard', '/classify'].includes(window.location.pathname)
      ? window.location.pathname
      : '/',
  )
  const [authReady, setAuthReady] = useState(false)
  const { checkSession, currentUser } = useAuth()

  useEffect(() => {
    function handlePopState() {
      setRoute(
        ['/dashboard', '/classify'].includes(window.location.pathname)
          ? window.location.pathname
          : '/',
      )
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initializeSession() {
      await checkSession()

      if (!cancelled) {
        setAuthReady(true)
      }
    }

    initializeSession()

    return () => {
      cancelled = true
    }
  }, [])

  function navigate(path) {
    if (window.location.pathname === path) {
      setRoute(path)
      return
    }

    window.history.pushState({}, '', path)
    setRoute(path)
  }

  function handleGitHubLogin() {
    window.location.href = buildUrl('/api/auth/github')
  }

  useEffect(() => {
    if (!authReady) {
      return
    }

    if (currentUser && route !== '/dashboard') {
      navigate('/dashboard')
      return
    }

    if (!currentUser && route === '/dashboard') {
      navigate('/')
    }
  }, [authReady, currentUser, route])

  if (!authReady) {
    return (
      <section className="panel session-panel">
        <h2>Checking your session</h2>
        <p className="empty-state">Loading your access...</p>
      </section>
    )
  }

  if (route === '/classify') {
    return (
      <ClassifyPage
        onBackHome={() => navigate('/')}
        onOpenDashboard={() => navigate('/dashboard')}
        onLogin={handleGitHubLogin}
        isHome={false}
      />
    )
  }

  if (route === '/dashboard') {
    return (
      <DashboardPage
        onLogin={handleGitHubLogin}
        onLogoutComplete={() => navigate('/')}
      />
    )
  }

  return (
    <ClassifyPage
      onBackHome={() => navigate('/')}
      onOpenDashboard={() => navigate('/dashboard')}
      onLogin={handleGitHubLogin}
      isHome
    />
  )
}

export default function AppRoot() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
