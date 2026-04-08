import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'
import SuggestionRow from '../components/SuggestionRow'
import CreateMenu from '../components/CreateMenu'
import api from '../api/axios'

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [postsRes, suggestionsRes] = await Promise.all([
          api.get('/posts/following'),
          api.get('/users/suggestions')
        ])
        setPosts(postsRes.data)
        setSuggestions(suggestionsRes.data)
      } catch (err) {
        console.error('Failed to fetch home data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId))
  }

  return (
    <div>
      <div className="feed-header">
        <h2>🏠 Home Feed</h2>
        <p>Posts from developers you follow</p>
      </div>

      <div className="section-divider" style={{ marginTop: '16px' }}>Following</div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : (
        <>
          {posts.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🤝</div>
              <h3>Your home feed is quiet</h3>
              <p>Follow some developers to see their latest code here!</p>
              
              <div style={{ marginTop: '30px', width: '100%' }}>
                <SuggestionRow suggestions={suggestions} />
              </div>
            </div>
          )}

          <div className="home-feed-list">
            {posts.map((post, index) => (
              <div key={post._id}>
                <PostCard post={post} onDelete={handleDelete} />
                {/* Inject suggestions after every 5 posts */}
                {(index + 1) % 5 === 0 && suggestions.length > 0 && (
                  <SuggestionRow suggestions={suggestions} />
                )}
              </div>
            ))}
          </div>

          {/* If there are few posts, still show suggestions at the end */}
          {posts.length > 0 && posts.length < 5 && suggestions.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <SuggestionRow suggestions={suggestions} />
            </div>
          )}
        </>
      )}

      <CreateMenu onPostCreated={handlePostCreated} />
    </div>
  )
}
