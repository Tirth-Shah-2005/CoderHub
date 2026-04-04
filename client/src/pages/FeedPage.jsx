import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'

import PostModal from '../components/PostModal'
import api from '../api/axios'

export default function FeedPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/posts')
      setPosts(res.data)
    } catch (err) {
      console.error('Failed to fetch posts', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId))
  }

  return (
    <div>
      <div className="feed-header">
        <h2>🌐 Global Feed</h2>
        <p>Discover code from developers around the world</p>
      </div>

      <div className="section-divider" style={{ marginTop: '16px' }}>Recent Posts</div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💻</div>
          <h3>No posts yet</h3>
          <p>Be the first one to share your code with the CoderHub community!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onDelete={handleDelete}
          />
        ))
      )}

      {/* Floating Action Button */}
      <button className="fab" onClick={() => setShowModal(true)} title="New Post">
        <span className="fab-icon">+</span>
        <span className="fab-label">Post Code</span>
      </button>

      {/* Post Modal */}
      {showModal && (
        <PostModal
          onPostCreated={handlePostCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
