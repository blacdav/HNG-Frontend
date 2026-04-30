export default function AuthScreen({ onEnterDashboard, onOpenClassifier, onLogin }) {
  return (
    <div className="auth-page">
      <section className="auth-hero-card">
        <p className="eyebrow">GitHub OAuth</p>
        <h1>Sign in to open the Genderize dashboard</h1>
        <p className="auth-page-copy">
          Use the public classifier without signing in, or continue into the dashboard
          for saved profiles and search tools.
        </p>

        <div className="auth-actions">
          <button type="button" className="ghost-button" onClick={onOpenClassifier}>
            Classify a Name
          </button>
          <button type="button" onClick={onEnterDashboard}>
            Go to Dashboard
          </button>
          <button type="button" className="ghost-button" onClick={onLogin}>
            Continue with GitHub
          </button>
        </div>
      </section>
    </div>
  )
}
