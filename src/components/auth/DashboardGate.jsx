import { useAuth } from '../../context/AuthContext'

export default function DashboardGate({ onLogin }) {
  const { checkingAuth, errorMessage, currentUser } = useAuth()

  if (checkingAuth) {
    return (
      <section className="panel session-panel">
        <h2>Checking your session</h2>
        <p className="empty-state">Loading your dashboard access...</p>
      </section>
    )
  }

  if (currentUser) {
    return null
  }

  return (
    <section className="panel session-panel">
      <h2>Session required</h2>
      <p className="empty-state">
        {errorMessage || 'No active session was found for this dashboard.'}
      </p>
      <div className="auth-actions">
        <button type="button" onClick={onLogin}>
          Continue with GitHub
        </button>
      </div>
    </section>
  )
}
