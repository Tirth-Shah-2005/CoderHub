import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Prism from 'prismjs'

// Import Prism languages
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-swift'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
// Note: HTML is 'markup' in prismjs, which is loaded by default.

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'HTML', 'CSS', 'SQL', 'Shell', 'Other',
]

const LANG_MAP = {
  JavaScript: 'javascript', TypeScript: 'typescript', Python: 'python',
  Java: 'java', C: 'c', 'C++': 'cpp', 'C#': 'csharp', Go: 'go',
  Rust: 'rust', PHP: 'php', Ruby: 'ruby', Swift: 'swift', Kotlin: 'kotlin',
  HTML: 'markup', CSS: 'css', SQL: 'sql', Shell: 'bash', Other: 'none'
}

function formatCountdown(ms) {
  if (ms <= 0) return 'now'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  const s = Math.floor((ms % 60000) / 1000)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
export default function PostModal({ onPostCreated, onClose }) {
  const { user } = useAuth()
  const [language, setLanguage] = useState('')
  const [code, setCode] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rateLimitMs, setRateLimitMs] = useState(0)
  const [countdown, setCountdown] = useState('')
  const [usage, setUsage] = useState({ count: 0, limit: 3 })

  useEffect(() => {
    let interval = null
    api.get('/posts/rate-limit-status').then(res => {
      const { code } = res.data
      setUsage({ count: code.count || 0, limit: code.limit || 3 })
      if (!code.canPost && code.msRemaining > 0) {
        setRateLimitMs(code.msRemaining)
        setCountdown(formatCountdown(code.msRemaining))
        let remaining = code.msRemaining
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
    if (!language) { setError('Please select a programming language'); return }
    if (!code.trim()) { setError('Code cannot be empty'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/posts', { postType: 'CODE', language, code: code.trim(), caption })
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

  const isBlocked = rateLimitMs > 0

  const getPrismLanguageString = (langLabel) => LANG_MAP[langLabel] || 'javascript'
  const highlightCode = (input) => {
    try {
      const langStr = LANG_MAP[language] || 'javascript'
      const grammar = Prism.languages[langStr] || Prism.languages.javascript || Prism.languages.clike;
      if (!grammar) return input || ''; // Fallback to plain text if no grammar
      return Prism.highlight(input || '', grammar, langStr)
    } catch (err) {
      console.error('Highlighting failed:', err)
      return input || ''
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3>💻 New Code Post</h3>
            <span className="usage-indicator">
              {usage.limit === -1 ? 'Unlimited' : `${usage.limit - usage.count} / ${usage.limit} remaining today`}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {isBlocked && (
          <div className="rate-limit-banner">
            <span className="rate-limit-icon">⏳</span>
            <div>
              <div className="rate-limit-title">Daily limit reached</div>
              <div className="rate-limit-sub">You've posted {usage.count} snippets today. Next allowed in <strong>{countdown}</strong></div>
            </div>
          </div>
        )}

        {error && !isBlocked && <div className="error-msg"><span>⚠</span> {error}</div>}

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

        <div className="form-group code-input-wrapper">
          <label className="form-label">💻 Paste Your Code</label>
          <div className="code-editor-container" style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', overflow: 'hidden', minHeight: '200px' }}>
            <textarea
              className="code-textarea-inner"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                margin: 0, border: 0, background: 'none', boxSizing: 'border-box',
                fontFamily: '"Fira Code", monospace', fontSize: '0.875rem', lineHeight: 1.7,
                whiteSpace: 'pre', wordBreak: 'normal', overflowWrap: 'normal',
                position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', resize: 'none',
                color: 'transparent', caretColor: 'var(--text-primary)', overflow: 'auto',
                padding: '16px'
              }}
            />
            <pre
              className="code-textarea-inner"
              aria-hidden="true"
              style={{
                margin: 0, border: 0, background: 'none', boxSizing: 'border-box',
                fontFamily: '"Fira Code", monospace', fontSize: '0.875rem', lineHeight: 1.7,
                whiteSpace: 'pre', wordBreak: 'normal', overflowWrap: 'normal',
                position: 'relative', pointerEvents: 'none',
                color: 'var(--text-primary)',
                padding: '16px'
              }}
              dangerouslySetInnerHTML={{ __html: highlightCode(code) || '<br/>' }}
            />
          </div>
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
            disabled={loading || isBlocked || !language || !code.trim()}
          >
            {loading ? '⏳ Posting...' : '🚀 Post Code'}
          </button>
        </div>
      </div>
    </div>
  )
}
