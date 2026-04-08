import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

export default function EditPostModal({ post, onUpdate, onClose }) {
  const [language, setLanguage] = useState(post.language || '')
  const [code, setCode] = useState(post.code || '')
  const [caption, setCaption] = useState(post.caption || '')
  const [tipText, setTipText] = useState(post.tipText || '')
  const [quizQuestion, setQuizQuestion] = useState(post.quizQuestion || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const postType = post.postType || 'CODE'

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const val = code
      setCode(val.substring(0, start) + '  ' + val.substring(e.target.selectionEnd))
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2 }, 0)
    }
  }

  const highlightCode = (input) => {
    try {
      const langStr = LANG_MAP[language] || 'javascript'
      const grammar = Prism.languages[langStr] || Prism.languages.javascript || Prism.languages.clike;
      if (!grammar) return input || '';
      return Prism.highlight(input || '', grammar, langStr)
    } catch (err) {
      return input || ''
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const data = {}
      if (postType === 'CODE') {
        data.language = language
        data.code = code
        data.caption = caption
      } else if (postType === 'TIP') {
        data.tipText = tipText
      } else if (postType === 'QUIZ') {
        data.language = language
        data.code = code
        data.quizQuestion = quizQuestion
      }

      const res = await api.put(`/posts/${post._id}`, data)
      onUpdate(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>✍️ Edit Post</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-msg"><span>⚠</span> {error}</div>}

        {postType === 'TIP' && (
          <div className="form-group">
            <label className="form-label">✍️ Your Tip</label>
            <textarea
              className="tip-textarea"
              value={tipText}
              onChange={(e) => setTipText(e.target.value)}
              rows={6}
              maxLength={400}
            />
            <div className="char-counter">{400-tipText.length} / 400 remaining</div>
          </div>
        )}

        {postType === 'QUIZ' && (
          <div className="form-group">
            <label className="form-label">❓ Your Question</label>
            <textarea
              className="caption-input"
              value={quizQuestion}
              onChange={(e) => setQuizQuestion(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <div className="char-counter">{200-quizQuestion.length} / 200 remaining</div>
          </div>
        )}

        {postType === 'CODE' && (
          <div className="form-group">
            <label className="form-label">📝 Caption</label>
            <textarea
              className="caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
            />
          </div>
        )}

        {(postType === 'CODE' || postType === 'QUIZ') && (
          <>
            <div className="form-group">
              <label className="form-label">
                🔤 Language {postType === 'QUIZ' ? '(optional)' : ''}
              </label>
              <select className="lang-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {postType === 'QUIZ' && <option value="">— Select Language —</option>}
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="form-group code-input-wrapper">
              <label className="form-label">
                💻 Code {postType === 'QUIZ' ? '(optional)' : ''}
              </label>
              <div className="code-editor-container" style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', overflow: 'hidden', minHeight: '180px' }}>
                <textarea
                  className="code-textarea-inner"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
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
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn-action" onClick={onClose} style={{ border: '1px solid var(--border-color)', padding: '10px 20px' }}>
            Cancel
          </button>
          <button
            className="btn-post"
            onClick={handleSave}
            disabled={loading}
            style={{ padding: '10px 24px' }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
