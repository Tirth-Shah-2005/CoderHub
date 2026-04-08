import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import GridPostCard from '../components/GridPostCard'

export default function ActivityListPage({ type }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchActivity()
  }, [type])

  const fetchActivity = async () => {
    setLoading(true)
    try {
      const mapping = { liked: 'likes', commented: 'comments', saved: '/folders' }
      const endpoint = type === 'saved' ? mapping[type] : `/activity/${mapping[type]}`
      const res = await api.get(endpoint)
      
      // If saved, we might have folders. For now, let's just get all posts from all folders 
      // or just show the folders. The user preferred a 3-column grid for posts.
      // Let's stick to the grid view for posts.
      if (type === 'saved') {
        // Flatten posts from all folders for the grid view
        const allSavedPosts = res.data.reduce((acc, folder) => {
          return [...acc, ...(folder.posts || [])]
        }, [])
        // Remove duplicates if any
        const uniquePosts = Array.from(new Set(allSavedPosts.map(p => p._id)))
          .map(id => allSavedPosts.find(p => p._id === id))
        setItems(uniquePosts)
      } else {
        setItems(res.data)
      }
    } catch (err) {
      console.error('Activity fetch error', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (postId) => {
    setItems(prev => prev.filter(p => p._id !== postId))
  }

  const titles = {
    liked: "❤️ Posts you've liked",
    commented: "💬 Posts you've commented on",
    saved: "🔖 Saved posts"
  }

  return (
    <div className="activity-page-full">
      <div className="settings-header">
        <button className="btn-back" onClick={() => navigate('/settings')}>← Back to Settings</button>
        <h1 style={{ marginTop: '16px' }}>{titles[type]}</h1>
        <p>You have {items.length} {type} posts</p>
      </div>

      <div className="activity-container">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>Nothing here yet</h3>
            <p>Go explore the feed to find interesting code snippets!</p>
          </div>
        ) : (
          <div className="activity-grid">
            {items.map(post => (
              <GridPostCard key={post._id} post={post} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
