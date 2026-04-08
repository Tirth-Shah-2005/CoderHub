import { useState, useEffect } from 'react'
import api from '../api/axios'
import Prism from 'prismjs'
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

export default function QuizModal({ onPostCreated, onClose }) {
  const [language, setLanguage] = useState('')
  const [code, setCode] = useState('')
  const [quizQuestion, setQuizQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rateLimitMs, setRateLimitMs] = useState(0)
  const [countdown, setCountdown] = useState('')
  const [usage, setUsage] = useState({ count: 0, limit: 1 })
  const Q_MAX = 200

  useEffect(() => {
    let interval = null
    api.get('/posts/rate-limit-status').then(res => {
      const { quiz } = res.data
      setUsage({ count: quiz.canPost ? 0 : 1, limit: 1 })
      if (!quiz.canPost && quiz.msRemaining > 0) {
        setRateLimitMs(quiz.msRemaining)
        setCountdown(formatCountdown(quiz.msRemaining))
        let remaining = quiz.msRemaining
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

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      setCode(code.substring(0, start) + '  ' + code.substring(e.target.selectionEnd))
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2 }, 0)
    }
  }

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

  const handleSubmit = async () => {
    if (!quizQuestion.trim()) { setError('Please enter your quiz question'); return }
    if (quizQuestion.length > Q_MAX) { setError(`Question must be under ${Q_MAX} characters`); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/posts', {
        postType: 'QUIZ',
        language,
        code: code.trim(),
        quizQuestion: quizQuestion.trim(),
      })
      onPostCreated(res.data)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to post quiz'
      setError(msg)
      if (err.response?.status === 429 && err.response?.data?.nextAllowedAt) {
        setRateLimitMs(Math.max(0, err.response.data.nextAllowedAt - Date.now()))
      }
    } finally {
      setLoading(false)
    }
  }

  const isBlocked = rateLimitMs > 0
  const qLeft = Q_MAX - quizQuestion.length

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3>🧩 Post a Quiz</h3>
            <span className="usage-indicator">
              {usage.limit - usage.count} / {usage.limit} left
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {isBlocked && (
          <div className="rate-limit-banner">
            <span className="rate-limit-icon">⏳</span>
            <div>
              <div className="rate-limit-title">Daily limit reached</div>
              <div className="rate-limit-sub">You can post another quiz in <strong>{countdown}</strong></div>
            </div>
          </div>
        )}

        {error && !isBlocked && <div className="error-msg"><span>⚠</span> {error}</div>}

        {/* Quiz Question */}
        <div className="form-group">
          <label className="form-label">❓ Your Question</label>
          <textarea
            className="caption-input"
            placeholder="Type your question here... (e.g. What does this code output?)"
            value={quizQuestion}
            onChange={(e) => { setQuizQuestion(e.target.value); setError('') }}
            disabled={isBlocked}
            rows={3}
            maxLength={Q_MAX}
          />
          <div className="char-counter" style={{ color: qLeft < 20 ? 'var(--red)' : 'var(--text-muted)' }}>
            {qLeft} / {Q_MAX} characters remaining
          </div>
        </div>

        {/* Language */}
        <div className="form-group">
          <label className="form-label">🔤 Programming Language (optional)</label>
          <select
            className="lang-select"
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setError('') }}
            disabled={isBlocked}
          >
            <option value="">— Select Language —</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Code Editor */}
        <div className="form-group code-input-wrapper">
          <label className="form-label">💻 Code Snippet (optional)</label>
          <div className="code-editor-container" style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', overflow: 'hidden', minHeight: '180px', opacity: isBlocked ? 0.5 : 1, pointerEvents: isBlocked ? 'none' : 'auto' }}>
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
                color: 'var(--text-primary)', padding: '16px'
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
            className="btn-post quiz-btn"
            onClick={handleSubmit}
            disabled={loading || isBlocked || !quizQuestion.trim()}
          >
            {loading ? '⏳ Posting...' : '🧩 Post Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}
