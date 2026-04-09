import { useState, useEffect } from 'react'
import api from '../api/axios'

function formatCountdown(ms) {
  if (ms <= 0) return 'now'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  const s = Math.floor((ms % 60000) / 1000)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function TipModal({ onPostCreated, onClose }) {
  const [tipText, setTipText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rateLimitMs, setRateLimitMs] = useState(0)
  const [countdown, setCountdown] = useState('')
  const [usage, setUsage] = useState({ count: 0, limit: 1 })
  const MAX = 400

  // Fetch rate limit status on mount
  useEffect(() => {
    let interval = null
    api.get('/posts/rate-limit-status').then(res => {
      const { tip } = res.data
      setUsage({ count: tip.canPost ? 0 : 1, limit: 1 })
      if (!tip.canPost && tip.msRemaining > 0) {
        setRateLimitMs(tip.msRemaining)
        setCountdown(formatCountdown(tip.msRemaining))
        let remaining = tip.msRemaining
        interval = setInterval(() => {
          remaining -= 1000
          if (remaining <= 0) {
            clearInterval(interval)
            setRateLimitMs(0)
            setCountdown('')
          } else {
            setCountdown(formatCountdown(remaining))
          }
        }, 1000)
      }
    }).catch(() => {})
    return () => { if (interval) clearInterval(interval) }
  }, [])

  const handleSubmit = async () => {
    if (!tipText.trim()) { setError('Tip cannot be empty'); return }
    if (tipText.length > MAX) { setError(`Max ${MAX} characters exceeded`); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/posts', { postType: 'TIP', tipText: tipText.trim() })
      onPostCreated(res.data)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to post tip'
      setError(msg)
      if (err.response?.status === 429 && err.response?.data?.nextAllowedAt) {
        setRateLimitMs(Math.max(0, err.response.data.nextAllowedAt - Date.now()))
      }
    } finally {
      setLoading(false)
    }
  }

  const isBlocked = rateLimitMs > 0
  const charLeft = MAX - tipText.length

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3>💡 Post a Tip</h3>
            <span className="usage-indicator">
              {usage.limit === -1 ? 'Unlimited' : `${usage.limit - usage.count} / ${usage.limit} left`}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {isBlocked && (
          <div className="rate-limit-banner">
            <span className="rate-limit-icon">⏳</span>
            <div>
              <div className="rate-limit-title">Daily limit reached</div>
              <div className="rate-limit-sub">You can post another tip in <strong>{countdown}</strong></div>
            </div>
          </div>
        )}

        {error && !isBlocked && <div className="error-msg"><span>⚠</span> {error}</div>}

        <div className="form-group">
          <label className="form-label">✍️ Your Tip</label>
          <textarea
            className="tip-textarea"
            placeholder="Share a coding tip, trick, or best practice..."
            value={tipText}
            onChange={(e) => { setTipText(e.target.value); setError('') }}
            disabled={isBlocked}
            rows={6}
            maxLength={MAX}
          />
          <div className="char-counter" style={{ color: charLeft < 20 ? 'var(--red)' : 'var(--text-muted)' }}>
            {charLeft} / {MAX} characters remaining
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn-action" onClick={onClose} style={{ border: '1px solid var(--border-color)', padding: '10px 20px' }}>
            Cancel
          </button>
          <button
            className="btn-post tip-btn"
            onClick={handleSubmit}
            disabled={loading || isBlocked || !tipText.trim() || tipText.length > MAX}
          >
            {loading ? '⏳ Posting...' : '💡 Share Tip'}
          </button>
        </div>
      </div>
    </div>
  )
}
