import { useEffect, useState } from 'react'
import { request } from '../api/client'
import DashboardGate from '../components/auth/DashboardGate'
import ProfileModal from '../components/profile/ProfileModal'
import { filterOptions, initialFilters, initialPagination } from '../constants/profile'
import { useAuth } from '../context/AuthContext'
import { normalizePagination } from '../utils/pagination'

function getDisplayUsername(user) {
  if (!user) {
    return 'Session pending'
  }

  return user.username ?? user.login ?? user.github_username ?? user.name ?? 'Unknown user'
}

function getDisplayRole(user) {
  if (!user) {
    return 'Role unavailable'
  }

  return user.role ?? user.user_role ?? user.account_type ?? 'User'
}

function getDisplayAvatar(user) {
  if (!user) {
    return ''
  }

  return user.avatar_url ?? user.avatar ?? user.image ?? user.profile_image ?? user.picture ?? ''
}

export default function DashboardPage({ onLogin }) {
  const { currentUser } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [profilesCount, setProfilesCount] = useState(0)
  const [filters, setFilters] = useState(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [createdName, setCreatedName] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [busyAction, setBusyAction] = useState('')
  const [pageError, setPageError] = useState('')
  const [viewMode, setViewMode] = useState('browse')
  const [pagination, setPagination] = useState(initialPagination)

  function handleRequestError(error) {
    setSelectedProfile(null)
    setPageError(error.message)
  }

  useEffect(() => {
    if (currentUser) {
      loadProfiles(initialFilters, 1, initialPagination.limit)
    } else {
      setProfiles([])
      setProfilesCount(0)
      setSelectedProfile(null)
    }
  }, [currentUser])

  async function loadProfiles(
    activeFilters = filters,
    page = pagination.page,
    limit = pagination.limit,
  ) {
    setLoadingProfiles(true)
    setPageError('')

    try {
      const payload = await request('/api/profiles', {
        params: {
          ...activeFilters,
          page,
          limit,
        },
      })

      setProfiles(payload.data ?? [])
      setProfilesCount(payload.count ?? 0)
      setPagination(normalizePagination(payload, page, limit))
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
      await loadProfiles(filters, 1, pagination.limit)
    } catch (error) {
      handleRequestError(error)
    } finally {
      setBusyAction('')
    }
  }

  async function runSearch(query, page = 1, limit = pagination.limit) {
    if (!query.trim()) {
      await loadProfiles(filters, page, limit)
      return
    }

    setLoadingProfiles(true)
    setPageError('')

    try {
      const payload = await request('/api/profiles/search', {
        params: {
          q: query.trim(),
          page,
          limit,
        },
      })

      setProfiles(payload.data ?? [])
      setProfilesCount(payload.count ?? 0)
      setPagination(normalizePagination(payload, page, limit))
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

      if (selectedProfile?.id === id) {
        setSelectedProfile(null)
      }

      if (viewMode === 'search' && searchQuery.trim()) {
        await runSearch(searchQuery, pagination.page, pagination.limit)
      } else {
        await loadProfiles(filters, pagination.page, pagination.limit)
      }
    } catch (error) {
      handleRequestError(error)
    } finally {
      setBusyAction('')
    }
  }

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) {
      return
    }

    if (viewMode === 'search' && searchQuery.trim()) {
      await runSearch(searchQuery, nextPage, pagination.limit)
      return
    }

    await loadProfiles(filters, nextPage, pagination.limit)
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">React + Vite Portal</p>
          <h1>Genderize API Dashboard</h1>
          <p className="hero-copy">
            Create enriched profiles, search intelligently, and inspect stored gender records
            in one focused workspace.
          </p>
        </div>
        <div className="hero-meta">
          {getDisplayAvatar(currentUser) && (
            <img
              className="hero-avatar"
              src={getDisplayAvatar(currentUser)}
              alt={getDisplayUsername(currentUser)}
            />
          )}
          <span>Signed in user</span>
          <code>{getDisplayUsername(currentUser)}</code>
          <span className="hero-meta-label">Role</span>
          <strong>{getDisplayRole(currentUser)}</strong>
        </div>
      </header>

      {pageError && <div className="banner error">{pageError}</div>}

      <DashboardGate onLogin={onLogin} />

      {currentUser && (
        <main className="dashboard-shell">
          <section className="dashboard-top">
            <article className="panel compact-panel">
              <div className="panel-heading">
                <h2>Create a Profile</h2>
              </div>

              <form className="form-row" onSubmit={handleCreateProfile}>
                <input
                  value={createdName}
                  onChange={(event) => setCreatedName(event.target.value)}
                  placeholder="Enter a name to create"
                />
                <button type="submit" disabled={busyAction === 'create'}>
                  {busyAction === 'create' ? 'Creating...' : 'Create Profile'}
                </button>
              </form>
            </article>
          </section>

          <section className="panel table-panel">
            <div className="table-panel-head">
              <div className="panel-heading">
                <h2>Find Profiles</h2>
                <p>Browse saved profiles with filters or natural-language search.</p>
              </div>
              <div className="table-summary">
                <span>Directory</span>
                <strong>{profilesCount} records</strong>
              </div>
            </div>

            <form className="toolbar toolbar-wide" onSubmit={handleSearch}>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search like: female adult in nigeria"
              />
              <button type="submit">Search</button>
            </form>

            <form className="filters filters-wide" onSubmit={handleFilterSubmit}>
              <select
                value={filters.gender}
                onChange={(event) => updateFilter('gender', event.target.value)}
              >
                <option value="">All genders</option>
                {filterOptions.gender
                  .filter(Boolean)
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>

              <select
                value={filters.age_group}
                onChange={(event) => updateFilter('age_group', event.target.value)}
              >
                <option value="">All age groups</option>
                {filterOptions.age_group
                  .filter(Boolean)
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>

              <input
                value={filters.country_id}
                onChange={(event) => updateFilter('country_id', event.target.value.toUpperCase())}
                maxLength={2}
                placeholder="Country code"
              />

              <button type="submit">Apply Filters</button>
            </form>

            <div className="profiles-header">
              <h3>{profilesCount} profile{profilesCount === 1 ? '' : 's'}</h3>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setFilters(initialFilters)
                  setSearchQuery('')
                  setSelectedProfile(null)
                  loadProfiles(initialFilters, 1, pagination.limit)
                }}
              >
                Reset
              </button>
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
                        <td className="col-country">{profile.country_name ?? profile.country_id ?? 'N/A'}</td>
                        <td className="col-actions">
                          <div className="table-actions">
                            <button
                              type="button"
                              className="secondary-button table-button"
                              onClick={() => handleProfileClick(profile.id)}
                              disabled={busyAction === `profile-${profile.id}`}
                            >
                              {busyAction === `profile-${profile.id}` ? 'Loading...' : 'View'}
                            </button>
                            <button
                              type="button"
                              className="danger-button table-button"
                              onClick={() => handleDeleteProfile(profile.id)}
                              disabled={busyAction === `delete-${profile.id}`}
                            >
                              {busyAction === `delete-${profile.id}` ? 'Deleting...' : 'Delete'}
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
              <p>
                Page {pagination.page} of {pagination.totalPages} - Total {pagination.totalItems || profilesCount}
              </p>
              <div className="pagination-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={loadingProfiles || !pagination.hasPreviousPage}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={loadingProfiles || !pagination.hasNextPage}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      <ProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  )
}
