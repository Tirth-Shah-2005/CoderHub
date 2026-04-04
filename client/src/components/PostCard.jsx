import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const LANG_CLASS_MAP = {
  JavaScript: 'js', TypeScript: 'ts', Python: 'python', Java: 'java',
  'C++': 'cpp', C: 'c', 'C#': 'csharp', Go: 'go', Rust: 'rust',
}

function getLangClass(language) {
  return LANG_CLASS_MAP[language] || 'default'
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

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [copied, setCopied] = useState(false)
  const [likes, setLikes] = useState(post.likes || [])
  const [comments, setComments] = useState(post.comments || [])

  const isLiked = user && likes.some((id) => id === user.id || id?._id === user.id || id === user.id)
  const isAuthor = user && post.author?.user_id === user.user_id

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

  return (
    <div className="post-card">
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
            <div className="post-user-id">@{post.author?.user_id || 'unknown'}</div>
            <div className="post-time">{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <span className={`lang-badge ${getLangClass(post.language)}`}>
          {post.language}
        </span>
      </div>

      {post.caption && (
        <div className="post-caption">{post.caption}</div>
      )}

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
          <pre>{post.code}</pre>
        </div>
      </div>

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

        {isAuthor && (
          <button className="btn-delete" onClick={handleDelete} title="Delete post">
            🗑️
          </button>
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
    </div>
  )
}
