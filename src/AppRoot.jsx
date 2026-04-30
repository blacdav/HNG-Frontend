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
  const { checkSession } = useAuth()

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
    if (route === '/dashboard') {
      checkSession()
    }
  }, [route])

  function navigate(path) {
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  function handleGitHubLogin() {
    window.location.href = buildUrl('/api/auth/github')
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
    return <DashboardPage onLogin={handleGitHubLogin} />
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
