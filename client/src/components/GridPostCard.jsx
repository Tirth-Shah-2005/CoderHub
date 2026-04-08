import { useState } from 'react'
import api from '../api/axios'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

const PRISM_LANG_MAP = {
  JavaScript: 'javascript', TypeScript: 'typescript', Python: 'python',
  Java: 'java', C: 'c', 'C++': 'cpp', 'C#': 'csharp', Go: 'go',
  Rust: 'rust', PHP: 'php', Ruby: 'ruby', Swift: 'swift', Kotlin: 'kotlin',
  HTML: 'markup', CSS: 'css', SQL: 'sql', Shell: 'bash', Other: 'none'
}

export default function GridPostCard({ post, onDelete }) {
  const [copied, setCopied] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this post?')) return
    try {
      await api.delete(`/posts/${post._id}`)
      onDelete && onDelete(post._id)
    } catch (err) {
      console.error('Delete error', err)
    }
  }

  const handleCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(post.code || post.tipText || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const postType = post.postType || 'CODE'

  return (
    <div className="grid-post-card">
      <div className="grid-post-header">
        <span className={`post-type-tag ${postType.toLowerCase()}`}>
          {postType === 'TIP' ? '💡' : postType === 'QUIZ' ? '🧩' : '💻'}
        </span>
        {post.language && (
          <span className="grid-lang-badge">{post.language}</span>
        )}
        <div className="grid-post-actions">
          <button className="grid-btn delete" onClick={handleDelete} title="Delete">🗑️</button>
        </div>
      </div>

      <div className="grid-post-body">
        {postType === 'TIP' ? (
          <p className="grid-tip-preview">{post.tipText}</p>
        ) : (
          <div className="grid-code-preview">
            <SyntaxHighlighter
              language={PRISM_LANG_MAP[post.language] || 'javascript'}
              useInlineStyles={false}
              PreTag="div"
            >
              {post.code?.slice(0, 100) + (post.code?.length > 100 ? '...' : '')}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      <div className="grid-post-footer">
        <div className="grid-stats">
          <span>❤️ {post.likes?.length || 0}</span>
          <span>💬 {post.comments?.length || 0}</span>
        </div>
        <button className={`grid-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          {copied ? '✅' : '📋'}
        </button>
      </div>
    </div>
  )
}
