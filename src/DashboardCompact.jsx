import { useEffect, useRef, useState } from 'react'
import { HiArrowDownTray, HiCheckCircle, HiFunnel, HiMagnifyingGlass, HiTrash, HiUser, HiViewfinderCircle, HiXMark } from 'react-icons/hi2'
import { downloadFile, request } from './api/client'
import DashboardGate from './components/auth/DashboardGate'
import ProfileModal from './components/profile/ProfileModal'
import { initialFilters, initialPagination, filterOptions } from './constants/profile'
import { useAuth } from './context/AuthContext'
import { getCollectionCount, getCollectionItems, normalizePagination } from './utils/pagination'

function getDisplayUsername(user) {
  if (!user) return 'Session pending'
  const value = user.username ?? user.login ?? user.github_username ?? user.name ?? 'Unknown user'
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown user'
}

function getDisplayRole(user) {
  if (!user) return 'Role unavailable'
  return user.role ?? user.user_role ?? user.account_type ?? 'User'
}

function isAdminUser(user) {
  const role = user?.role ?? user?.user_role ?? user?.account_type ?? ''
  return String(role).toLowerCase() === 'admin'
}

function getDisplayAvatar(user) {
  if (!user) return ''
  return user.avatar_url ?? user.avatar ?? user.image ?? user.profile_image ?? user.picture ?? ''
}

function getExportParams(viewMode, searchQuery, filters) {
  if (viewMode === 'search' && searchQuery.trim()) {
    return { q: searchQuery.trim() }
  }

  const parts = []

  if (filters.gender) parts.push(filters.gender)
  if (filters.age_group) parts.push(filters.age_group)
  if (filters.country) parts.push(filters.country)

  return { q: parts.join(' ').trim() }
}

export default function DashboardCompact({ onLogin, onLogoutComplete }) {
  const { currentUser, logout } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [profilesCount, setProfilesCount] = useState(0)
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [createdName, setCreatedName] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [busyAction, setBusyAction] = useState('')
  const [pageError, setPageError] = useState('')
  const [viewMode, setViewMode] = useState('browse')
  const [pagination, setPagination] = useState(initialPagination)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const menuRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  const exportQuery = getExportParams(viewMode, activeSearchQuery, appliedFilters).q

  useEffect(() => {
    if (currentUser) {
      setAppliedFilters(initialFilters)
      setActiveSearchQuery('')
      loadProfiles(initialFilters, 1, initialPagination.limit)
    } else {
      setProfiles([])
      setProfilesCount(0)
      setSelectedProfile(null)
    }
  }, [currentUser])

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  function handleRequestError(error) {
    setSelectedProfile(null)
    setDeleteTarget(null)
    setPageError(error.message)
  }

  async function loadProfiles(activeFilters = appliedFilters, page = pagination.page, limit = pagination.limit) {
    setLoadingProfiles(true)
    setPageError('')
    try {
      const payload = await request('/api/profiles', { params: { ...activeFilters, page, limit } })
      setProfiles(getCollectionItems(payload))
      setProfilesCount(getCollectionCount(payload))
      setPagination(normalizePagination(payload, page, limit))
      setAppliedFilters(activeFilters)
      setActiveSearchQuery('')
      setViewMode('browse')
    } catch (error) {
      handleRequestError(error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  async function handleCreateProfile(event) {
    event.preventDefault()
    if (!createdName.trim()) {
      setPageError('Please enter a name to create a profile.')
      return
    }
    setBusyAction('create')
    setPageError('')
    try {
      const payload = await request('/api/profiles', {
        method: 'POST',
        body: JSON.stringify({ name: createdName.trim() }),
      })
      setCreatedName('')
      setSelectedProfile(payload.data)
      await loadProfiles(appliedFilters, 1, pagination.limit)
    } catch (error) {
      handleRequestError(error)
    } finally {
      setBusyAction('')
    }
  }

  async function runSearch(query, page = 1, limit = pagination.limit) {
    if (!query.trim()) {
      await loadProfiles(appliedFilters, page, limit)
      return
    }
    setLoadingProfiles(true)
    setPageError('')
    try {
      const payload = await request('/api/profiles/search', {
        params: { q: query.trim(), page, limit },
      })
      setProfiles(getCollectionItems(payload))
      setProfilesCount(getCollectionCount(payload))
      setPagination(normalizePagination(payload, page, limit))
      setActiveSearchQuery(query.trim())
      setViewMode('search')
    } catch (error) {
      handleRequestError(error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    await runSearch(searchQuery, 1, pagination.limit)
  }

  async function handleFilterSubmit(event) {
    event.preventDefault()
    setSearchQuery('')
    await loadProfiles(filters, 1, pagination.limit)
  }

  async function handleProfileClick(id) {
    setBusyAction(`profile-${id}`)
    setPageError('')
    try {
      const payload = await request(`/api/profiles/${id}`)
      setSelectedProfile(payload.data)
    } catch (error) {
      handleRequestError(error)
    } finally {
      setBusyAction('')
    }
  }

  async function handleDeleteProfile(id) {
    setBusyAction(`delete-${id}`)
    setPageError('')
    try {
      await request(`/api/profiles/${id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      if (selectedProfile?.id === id) setSelectedProfile(null)
      if (viewMode === 'search' && activeSearchQuery) {
        await runSearch(activeSearchQuery, pagination.page, pagination.limit)
      } else {
        await loadProfiles(appliedFilters, pagination.page, pagination.limit)
      }
      showToast('Profile deleted successfully.')
    } catch (error) {
      handleRequestError(error)
    } finally {
      setBusyAction('')
    }
  }

  function showToast(message) {
    setToastMessage(message)
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('')
      toastTimeoutRef.current = null
    }, 2800)
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  async function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) return
    if (viewMode === 'search' && activeSearchQuery) {
      await runSearch(activeSearchQuery, nextPage, pagination.limit)
      return
    }
    await loadProfiles(appliedFilters, nextPage, pagination.limit)
  }

  async function handleLogout() {
    setMenuOpen(false)
    setSelectedProfile(null)
    setDeleteTarget(null)
    await logout()
    onLogoutComplete?.()
  }

  async function handleExportProfiles() {
    if (!exportQuery) {
      setPageError('Enter a search query or apply filters before exporting profiles.')
      return
    }

    setBusyAction('export')
    setPageError('')

    try {
      await downloadFile('/api/profiles/export', {
        method: 'GET',
        params: { q: exportQuery },
        filename: 'profiles-export.csv',
      })
    } catch (error) {
      handleRequestError(error)
    } finally {
      setBusyAction('')
    }
  }

  return (
    <div className="app-shell">
      <header className="hero hero-compact">
        <div className="hero-title-group">
          <h1>Insighta dashboard</h1>
        </div>
        <div className="hero-user-menu" ref={menuRef}>
          <button
            type="button"
            className="hero-meta hero-meta-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {getDisplayAvatar(currentUser) && (
              <img className="hero-avatar" src={getDisplayAvatar(currentUser)} alt={getDisplayUsername(currentUser)} />
            )}
            <div className="hero-meta-stack">
              <code>{getDisplayUsername(currentUser)}</code>
              <strong>{getDisplayRole(currentUser)}</strong>
            </div>
            <span className="hero-menu-caret" aria-hidden="true">▾</span>
          </button>

          {menuOpen && (
            <div className="hero-menu-dropdown" role="menu">
              <button type="button" className="hero-menu-item" role="menuitem" onClick={handleLogout}>
                <HiUser /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {pageError && <div className="banner error">{pageError}</div>}
      <DashboardGate onLogin={onLogin} />

      {currentUser && (
        <main className="dashboard-shell">
          <section className="dashboard-top">
            <section className="panel table-panel">
              <div className="table-panel-head">
                <div className="panel-heading">
                  <h2>Find Profiles</h2>
                  <p>Browse saved profiles with filters or natural-language search.</p>
                </div>
              </div>
    
              <form className="toolbar toolbar-wide" onSubmit={handleSearch}>
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search like: female adult in nigeria" />
                <button type="submit"><HiMagnifyingGlass /> Search</button>
              </form>

              <form className="filters filters-wide" onSubmit={handleFilterSubmit}>
                <select value={filters.gender} onChange={(event) => updateFilter('gender', event.target.value)}>
                  <option value="">All genders</option>
                  {filterOptions.gender.filter(Boolean).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select value={filters.age_group} onChange={(event) => updateFilter('age_group', event.target.value)}>
                  <option value="">All age groups</option>
                  {filterOptions.age_group.filter(Boolean).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <input value={filters.country} onChange={(event) => updateFilter('country', event.target.value)} placeholder="Country" />
                <select value={filters.sort_by} onChange={(event) => updateFilter('sort_by', event.target.value)}>
                  <option value="">Sort by</option>
                  {filterOptions.sort_by.filter(Boolean).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select value={filters.order} onChange={(event) => updateFilter('order', event.target.value)}>
                  <option value="">Order</option>
                  {filterOptions.order.filter(Boolean).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <button type="submit"><HiFunnel /> Apply Filters</button>
              </form>

              <div className="profiles-header">
                <h3>{profilesCount} profile{profilesCount === 1 ? '' : 's'}</h3>
                <div className="profiles-header-actions">
                  <button
                    type="button"
                    className="secondary-button header-action-button"
                    onClick={handleExportProfiles}
                    disabled={busyAction === 'export' || !exportQuery}
                  >
                    <HiArrowDownTray /> {busyAction === 'export' ? 'Exporting CSV...' : 'Export CSV'}
                  </button>
                  <button type="button" className="ghost-button header-action-button" onClick={() => {
                    setFilters(initialFilters)
                    setAppliedFilters(initialFilters)
                    setSearchQuery('')
                    setActiveSearchQuery('')
                    setSelectedProfile(null)
                    loadProfiles(initialFilters, 1, pagination.limit)
                  }}>
                    Reset
                  </button>
                </div>
              </div>

              {loadingProfiles ? (
                <p className="empty-state">Loading profiles...</p>
              ) : profiles.length === 0 ? (
                <p className="empty-state">No profiles matched your request.</p>
              ) : (
                <div className="table-wrap fullscreen-table">
                  <table className="profiles-table">
                    <colgroup>
                      <col className="col-name" />
                      <col className="col-gender" />
                      <col className="col-age-group" />
                      <col className="col-age" />
                      <col className="col-country" />
                      <col className="col-actions" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="col-name">Name</th>
                        <th className="col-gender">Gender</th>
                        <th className="col-age-group">Age Group</th>
                        <th className="col-age">Age</th>
                        <th className="col-country">Country</th>
                        <th className="col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((profile) => (
                        <tr key={profile.id}>
                          <td className="col-name">{profile.name}</td>
                          <td className={`col-gender ${profile.gender}`}>{profile.gender ?? 'unknown'}</td>
                          <td className="col-age-group">{profile.age_group ?? 'N/A'}</td>
                          <td className="col-age">{profile.age ?? 'N/A'}</td>
                          <td className="col-country">{profile.country_name ?? profile.country ?? profile.country_id ?? 'N/A'}</td>
                          <td className="col-actions">
                            <div className="table-actions">
                              <button type="button" className="secondary-button table-button" onClick={() => handleProfileClick(profile.id)} disabled={busyAction === `profile-${profile.id}`}>
                                <HiViewfinderCircle /> {busyAction === `profile-${profile.id}` ? 'Loading...' : 'View'}
                              </button>
                              <button type="button" className="danger-button table-button" onClick={() => setDeleteTarget(profile)} disabled={busyAction === `delete-${profile.id}`}>
                                <HiTrash /> {busyAction === `delete-${profile.id}` ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pagination-bar">
                <p>Page {pagination.page} of {pagination.totalPages} - Total {pagination.totalItems || profilesCount}</p>
                <div className="pagination-actions">
                  <button type="button" className="ghost-button" onClick={() => handlePageChange(pagination.page - 1)} disabled={loadingProfiles || !pagination.hasPreviousPage}>Previous</button>
                  <button type="button" onClick={() => handlePageChange(pagination.page + 1)} disabled={loadingProfiles || !pagination.hasNextPage}>Next</button>
                </div>
              </div>
            </section>

            <article className="panel compact-panel create-profile-card">
              <div className="create-profile-intro">
                <div className="create-profile-copy">
                  <span className="card-kicker">Profile Builder</span>
                  <div className="panel-heading create-profile-heading">
                    <h2>Create a Profile</h2>
                    <p>Generate and save a profile record from a submitted name in one step.</p>
                  </div>
                </div>
              </div>

              <form className="create-profile-form" onSubmit={handleCreateProfile}>
                <label className="create-profile-field">
                  <span>First name</span>
                  <input
                    value={createdName}
                    onChange={(event) => setCreatedName(event.target.value)}
                    placeholder="Enter a name to create"
                  />
                </label>
                <div className="create-profile-actions">
                  <button type="submit" disabled={busyAction === 'create'}>
                    <HiUser /> {busyAction === 'create' ? 'Creating...' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </article>
          </section>
        </main>
      )}

      {toastMessage && (
        <div className="toast toast-success" role="status" aria-live="polite">
          <HiCheckCircle />
          <span>{toastMessage}</span>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-card confirm-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <div className="modal-header">
              <div>
                <p className="modal-eyebrow"><HiTrash /> Delete Profile</p>
                <h2 id="delete-confirm-title">Delete {deleteTarget.name}?</h2>
              </div>
              <button type="button" className="modal-close-button" onClick={() => setDeleteTarget(null)} aria-label="Close modal">
                <HiXMark />
              </button>
            </div>
            <p className="confirm-modal-copy">
              This action will remove the profile from your directory. You can’t undo this deletion.
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="ghost-button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => handleDeleteProfile(deleteTarget.id)}
                disabled={busyAction === `delete-${deleteTarget.id}`}
              >
                <HiTrash />
                {busyAction === `delete-${deleteTarget.id}` ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileModal
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        canViewAdminFields={isAdminUser(currentUser)}
      />
    </div>
  )
}
