import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { useTheme } from '../context/ThemeContext'
import EditPostModal from './EditPostModal'
import SavePostModal from './SavePostModal'

const LANG_CLASS_MAP = {
  JavaScript: 'js', TypeScript: 'ts', Python: 'python', Java: 'java',
  'C++': 'cpp', C: 'c', 'C#': 'csharp', Go: 'go', Rust: 'rust',
}

function getLangClass(language) {
  return LANG_CLASS_MAP[language] || 'default'
}

const PRISM_LANG_MAP = {
  JavaScript: 'javascript', TypeScript: 'typescript', Python: 'python',
  Java: 'java', C: 'c', 'C++': 'cpp', 'C#': 'csharp', Go: 'go',
  Rust: 'rust', PHP: 'php', Ruby: 'ruby', Swift: 'swift', Kotlin: 'kotlin',
  HTML: 'markup', CSS: 'css', SQL: 'sql', Shell: 'bash', Other: 'none'
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function isAccountNew(createdAt) {
  if (!createdAt) return false
  const diff = Date.now() - new Date(createdAt).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000
}

export default function PostCard({ post: initialPost, onUpdate: onParentUpdate, onDelete }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [post, setPost] = useState(initialPost)
  const [showComments, setShowComments] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [copied, setCopied] = useState(false)
  const [likes, setLikes] = useState(post.likes || [])
  const [comments, setComments] = useState(post.comments || [])

  const isLiked = user && likes.some((id) => id === user.id || id?._id === user.id || id === user.id)
  const isAuthor = user && post.author?.user_id === user.user_id
  const postType = post.postType || 'CODE'

  const handleLike = async () => {
    try {
      const res = await api.put(`/posts/${post._id}/like`)
      setLikes(res.data.likes)
    } catch (err) {
      console.error('Like error', err)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const res = await api.post(`/posts/${post._id}/comment`, { text: commentText })
      setComments(res.data)
      setCommentText('')
    } catch (err) {
      console.error('Comment error', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      await api.delete(`/posts/${post._id}`)
      onDelete && onDelete(post._id)
    } catch (err) {
      console.error('Delete error', err)
    }
  }

  const handleUpdate = (updatedPost) => {
    setPost(updatedPost)
    onParentUpdate && onParentUpdate(updatedPost)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(post.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleComment()
    }
  }

  // Post type badge config
  const typeConfig = {
    CODE: null,
    TIP: { label: '💡 Tip', cls: 'badge-tip' },
    QUIZ: { label: '🧩 Quiz', cls: 'badge-quiz' },
  }
  const typeBadge = typeConfig[postType]

  return (
    <div className={`post-card post-type-${postType.toLowerCase()}`}>
      <div className="post-header">
        <div className="post-author">
          <div
            className="post-avatar"
            style={{
              background: post.author?.profileImage ? 'transparent' : (post.author?.avatarColor || 'linear-gradient(135deg, #58a6ff, #bc8cff)'),
              overflow: 'hidden',
            }}
          >
            {post.author?.profileImage
              ? <img src={post.author.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : post.author?.user_id?.[0]?.toUpperCase() || '?'
            }
          </div>
          <div>
            <div className="post-user-id">
              @{post.author?.user_id || 'unknown'}
              {post.isEdited && <span className="edited-indicator"> (edited)</span>}
              {isAccountNew(post.author?.createdAt) && <span className="new-badge">New</span>}
            </div>
            <div className="post-time">{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {typeBadge && (
            <span className={`post-type-badge ${typeBadge.cls}`}>{typeBadge.label}</span>
          )}
          {postType !== 'TIP' && post.language && (
            <span className={`lang-badge ${getLangClass(post.language)}`}>
              {post.language}
            </span>
          )}
        </div>
      </div>

      {/* TIP post body */}
      {postType === 'TIP' && (
        <div className="tip-body">
          <p className="tip-text">{post.tipText}</p>
        </div>
      )}

      {/* QUIZ: show question above code */}
      {postType === 'QUIZ' && post.quizQuestion && (
        <div className="quiz-question-block">
          <span className="quiz-question-icon">❓</span>
          <p className="quiz-question-text">{post.quizQuestion}</p>
        </div>
      )}

      {/* Caption (CODE posts) */}
      {postType === 'CODE' && post.caption && (
        <div className="post-caption">{post.caption}</div>
      )}

      {/* Code block (CODE and QUIZ) */}
      {(postType === 'CODE' || postType === 'QUIZ') && post.code && (
        <div className="post-code-block">
          <div className="code-block-header">
            <span className="code-block-lang">{post.language?.toLowerCase()}</span>
            <button
              className={`btn-copy ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
          <div className="code-content">
            <SyntaxHighlighter
              language={PRISM_LANG_MAP[post.language] || 'javascript'}
              useInlineStyles={false}
              PreTag="div"
            >
              {post.code}
            </SyntaxHighlighter>
          </div>
        </div>
      )}

      <div className="post-actions">
        <button
          className={`btn-action ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          {isLiked ? '❤️' : '🤍'} {likes.length}
        </button>

        <button
          className="btn-action comment"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {comments.length}
        </button>

        <button 
          className="btn-action save" 
          onClick={() => setShowSaveModal(true)}
          title="Save to folder"
        >
          🔖
        </button>

        {isAuthor && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button className="btn-action edit" onClick={() => setShowEditModal(true)} title="Edit post">
              ✏️
            </button>
            <button className="btn-delete" onClick={handleDelete} title="Delete post">
              🗑️
            </button>
          </div>
        )}
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comment-input-row">
            <div className="comment-avatar">
              {user?.user_id?.[0]?.toUpperCase()}
            </div>
            <input
              className="comment-input"
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="btn-submit-comment"
              onClick={handleComment}
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? '...' : 'Post'}
            </button>
          </div>

          {comments.length > 0 && (
            <div className="comments-list">
              {comments.map((comment, i) => (
                <div className="comment-item" key={comment._id || i}>
                  <div className="comment-avatar">
                    {comment.user_id?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="comment-body">
                    <div className="comment-user">@{comment.user_id}</div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {comments.length === 0 && (
            <p style={{ textAlign: 'center', padding: '14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No comments yet. Be the first! 💬
            </p>
          )}
        </div>
      )}

      {showEditModal && (
        <EditPostModal
          post={post}
          onUpdate={handleUpdate}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showSaveModal && (
        <SavePostModal
          postId={post._id}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  )
}
