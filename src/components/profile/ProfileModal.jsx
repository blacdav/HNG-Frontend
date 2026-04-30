import { formatDate, formatPercent } from '../../utils/formatters'
import { HiUserCircle, HiXMark } from 'react-icons/hi2'

export default function ProfileModal({ profile, onClose, canViewAdminFields = false }) {
  if (!profile) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow"><HiUserCircle /> Profile Details</p>
            <h2 id="profile-modal-title">{profile.name}</h2>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close modal">
            <HiXMark />
          </button>
        </div>

        <div className="detail-list">
          {canViewAdminFields && (
            <div>
              <span>ID</span>
              <strong>{profile.id ?? 'N/A'}</strong>
            </div>
          )}
          <div>
            <span>Gender</span>
            <strong>{profile.gender}</strong>
          </div>
          <div>
            <span>Gender Probability</span>
            <strong>{formatPercent(profile.gender_probability)}</strong>
          </div>
          <div>
            <span>Sample Size</span>
            <strong>{profile.sample_size ?? 'N/A'}</strong>
          </div>
          <div>
            <span>Age</span>
            <strong>{profile.age ?? 'N/A'}</strong>
          </div>
          <div>
            <span>Age Group</span>
            <strong>{profile.age_group ?? 'N/A'}</strong>
          </div>
          <div>
            <span>Country</span>
            <strong>{profile.country_name ?? profile.country ?? 'N/A'}</strong>
          </div>
          <div>
            <span>Country Code</span>
            <strong>{profile.country_id ?? 'N/A'}</strong>
          </div>
          <div>
            <span>Country Probability</span>
            <strong>{formatPercent(profile.country_probability)}</strong>
          </div>
          {canViewAdminFields && (
            <div>
              <span>Created</span>
              <strong>{formatDate(profile.createdAt)}</strong>
            </div>
          )}
          {canViewAdminFields && (
            <div>
              <span>Updated</span>
              <strong>{formatDate(profile.updatedAt)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
