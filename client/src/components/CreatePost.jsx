import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
  'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'HTML', 'CSS', 'SQL', 'Shell', 'Other',
]

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [language, setLanguage] = useState('')
  const [code, setCode] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!language) { setError('Please select a programming language'); return }
    if (!code.trim()) { setError('Code cannot be empty'); return }

    setLoading(true)
    setError('')
    try {
      const res = await api.post('/posts', { language, code: code.trim(), caption })
      onPostCreated(res.data)
      setLanguage('')
      setCode('')
      setCaption('')
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
      const end = e.target.selectionEnd
      const value = code
      setCode(value.substring(0, start) + '  ' + value.substring(end))
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div className="create-post">
      <div className="create-post-header">
        <div className="mini-avatar">{user?.user_id?.[0]?.toUpperCase()}</div>
        <div>
          <span>@{user?.user_id}</span>
          <br />
          <small>Share your code with the world</small>
        </div>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: '14px' }}>
          <span>⚠</span> {error}
        </div>
      )}

      <div className="lang-select-wrapper">
        <div className="lang-select-label">
          <span>🔤</span> Programming Language
        </div>
        <select
          className="lang-select"
          value={language}
          onChange={(e) => { setLanguage(e.target.value); setError('') }}
        >
          <option value="">— Select Language —</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <textarea
        className="caption-input"
        placeholder="Add a short description or title... (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={300}
        rows={2}
      />

      <div className="code-input-wrapper">
        <div className="code-input-label">
          <span>💻</span> Paste Your Code
        </div>
        <textarea
          className="code-textarea"
          placeholder={`// Paste your ${language || 'code'} here...\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}`}
          value={code}
          onChange={(e) => { setCode(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
      </div>

      <div className="create-post-footer">
        {code && (
          <span className="char-count">{code.split('\n').length} lines</span>
        )}
        <button
          className="btn-post"
          onClick={handleSubmit}
          disabled={loading || !language || !code.trim()}
        >
          {loading ? '⏳' : '🚀'} {loading ? 'Posting...' : 'Post Code'}
        </button>
      </div>
    </div>
  )
}
