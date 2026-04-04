import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'HTML', 'CSS', 'SQL', 'Shell', 'Other',
]

export default function PostModal({ onPostCreated, onClose }) {
  const { user } = useAuth()
  const [language, setLanguage] = useState('')
  const [code, setCode] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!language) { setError('Please select a programming language'); return }
    if (!code.trim()) { setError('Code cannot be empty'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/posts', { language, code: code.trim(), caption })
      onPostCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const val = code
      setCode(val.substring(0, start) + '  ' + val.substring(e.target.selectionEnd))
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2 }, 0)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>💻 New Code Post</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-msg"><span>⚠</span> {error}</div>}

        <div className="form-group">
          <label className="form-label">🔤 Programming Language</label>
          <select
            className="lang-select"
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setError('') }}
          >
            <option value="">— Select Language —</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">📝 Caption (optional)</label>
          <textarea
            className="caption-input"
            placeholder="Add a short description..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={300}
            rows={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label">💻 Paste Your Code</label>
          <textarea
            className="code-textarea"
            placeholder={`// Paste your ${language || 'code'} here...`}
            value={code}
            onChange={(e) => { setCode(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            style={{ minHeight: '200px' }}
          />
          {code && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {code.split('\n').length} lines
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn-action" onClick={onClose} style={{ border: '1px solid var(--border-color)', padding: '10px 20px' }}>
            Cancel
          </button>
          <button
            className="btn-post"
            onClick={handleSubmit}
            disabled={loading || !language || !code.trim()}
          >
            {loading ? '⏳ Posting...' : '🚀 Post Code'}
          </button>
        </div>
      </div>
    </div>
  )
}
