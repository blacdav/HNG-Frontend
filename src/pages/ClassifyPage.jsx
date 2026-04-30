import { useState } from 'react'
import { HiArrowRight, HiMagnifyingGlass, HiSparkles } from 'react-icons/hi2'
import { request } from '../api/client'
import ClassificationModal from '../components/profile/ClassificationModal'

export default function ClassifyPage({ onBackHome, onOpenDashboard, onLogin, isHome = false }) {
  const [name, setName] = useState('')
  const [classification, setClassification] = useState(null)
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) {
      setErrorMessage('Please enter a first name to genderize.')
      return
    }

    setBusy(true)
    setErrorMessage('')

    try {
      const payload = await request(`/api/classify?name=${encodeURIComponent(name.trim())}`)
      setClassification(payload.data)
      setName('')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (isHome) {
    return (
      <div className="landing-page">
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="landing-badge"><HiSparkles /> Insighta</p>
            <h1>Turn a simple first name into fast demographic insight.</h1>
            <p className="landing-lead">
              Check a name instantly, then continue into a focused workspace for saved profiles and exports.
            </p>

            <div className="landing-actions">
              <button type="button" onClick={onOpenDashboard}>
                Open Dashboard <HiArrowRight />
              </button>
              {onLogin && (
                <button type="button" className="ghost-button" onClick={onLogin}>
                  Sign in with GitHub
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="landing-classifier">
            <div className="landing-classifier-card">
              <div className="landing-classifier-head">
                <p className="eyebrow">Instant Genderize</p>
                <h2>Check a first name in seconds</h2>
                <p>Public, quick, and ready.</p>
              </div>

            {errorMessage && <div className="banner error">{errorMessage}</div>}

            <form className="classify-page-form landing-form landing-form-centered" onSubmit={handleSubmit}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter a first name"
              />
              <button type="submit" disabled={busy}>
                <HiMagnifyingGlass /> {busy ? 'Checking...' : 'Genderize Name'}
              </button>
            </form>

            <div className="landing-preview-grid">
              <div>
                <span>Public</span>
                <strong>No sign-in needed</strong>
              </div>
              <div>
                <span>Workspace</span>
                <strong>Save and export later</strong>
              </div>
            </div>
          </div>
        </section>

        <ClassificationModal classification={classification} onClose={() => setClassification(null)} />
      </div>
    )
  }

  return (
    <div className="auth-page">
      <section className="auth-hero-card classify-page-card landing-card">
        <p className="eyebrow">{isHome ? 'Genderize Portal' : 'Public Classifier'}</p>
        <h1>{isHome ? 'Discover likely gender insights from a first name' : 'Genderize a first name without signing in'}</h1>
        <p className="auth-page-copy">
          {isHome
            ? 'Start with a quick public genderize check, then continue into the dashboard when you need saved profiles, search, and record management.'
            : 'This page is public. Enter a first name to genderize it, then open the dashboard only when you need profile management features.'}
        </p>

        {errorMessage && <div className="banner error">{errorMessage}</div>}

        <form className="classify-page-form" onSubmit={handleSubmit}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter a first name"
          />
          <div className="auth-actions classify-page-actions">
            <button type="submit" disabled={busy}>
              <HiMagnifyingGlass /> {busy ? 'Checking...' : 'Genderize Name'}
            </button>
            <button type="button" className="ghost-button" onClick={onOpenDashboard}>
              Open Dashboard <HiArrowRight />
            </button>
            {onLogin && (
              <button type="button" className="ghost-button" onClick={onLogin}>
                Sign in with GitHub
              </button>
            )}
            {!isHome && (
              <button type="button" className="ghost-button" onClick={onBackHome}>
                Back
              </button>
            )}
          </div>
        </form>
      </section>

      <ClassificationModal classification={classification} onClose={() => setClassification(null)} />
    </div>
  )
}
