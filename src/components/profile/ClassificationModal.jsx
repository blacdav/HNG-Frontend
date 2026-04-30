import { formatDate, formatPercent } from '../../utils/formatters'
import { HiSparkles, HiXMark } from 'react-icons/hi2'

function getClassificationName(classification) {
  return classification.name ?? classification.first_name ?? 'Unknown name'
}

function getClassificationProbability(classification) {
  return (
    classification.probability ??
    classification.gender_probability ??
    classification.confidence_score ??
    null
  )
}

function getClassificationSampleSize(classification) {
  return (
    classification.sample_size ??
    classification.sampleSize ??
    classification.count ??
    null
  )
}

function getClassificationProcessedAt(classification) {
  return (
    classification.processed_at ??
    classification.createdAt ??
    classification.updatedAt ??
    null
  )
}

export default function ClassificationModal({ classification, onClose }) {
  if (!classification) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="classification-modal-title"
      >
        <div className="modal-header classification-modal-header">
          <div>
            <p className="modal-eyebrow"><HiSparkles /> Genderize Result</p>
            <h2 id="classification-modal-title">{getClassificationName(classification)}</h2>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close modal">
            <HiXMark />
          </button>
        </div>

        <div className="classification-modal-grid">
          <div>
            <span>Name</span>
            <strong>{getClassificationName(classification)}</strong>
          </div>
          <div>
            <span>Gender</span>
            <strong className={classification.gender}>{classification.gender ?? 'unknown'}</strong>
          </div>
          <div>
            <span>Probability</span>
            <strong>{formatPercent(getClassificationProbability(classification))}</strong>
          </div>
          <div>
            <span>Sample Size</span>
            <strong>{getClassificationSampleSize(classification)?.toLocaleString?.() ?? getClassificationSampleSize(classification) ?? 'N/A'}</strong>
          </div>
          <div>
            <span>Confidence</span>
            <strong>{classification.is_confident ? 'High' : 'Low'}</strong>
          </div>
          <div>
            <span>Processed</span>
            <strong>{formatDate(getClassificationProcessedAt(classification))}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
