import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import SuggestionRow from '../components/SuggestionRow'
import api from '../api/axios'

export default function UserProfilePage() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [mutualFollowers, setMutualFollowers] = useState([])
  const [suggestions, setSuggestions] = useState([])

  const isOwnProfile = currentUser?.user_id === userId

  useEffect(() => {
    if (userId) fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const res = await api.get(`/users/${userId}`)
      setProfile(res.data.user)
      setPosts(res.data.posts)
      setIsFollowing(res.data.isFollowing)
      setFollowersCount(res.data.user.followersCount || 0)
      setMutualFollowers(res.data.mutualFollowers || [])

      // Fetch suggestions for profile discovery
      const sugRes = await api.get('/users/suggestions')
      setSuggestions(sugRes.data.filter(s => s.user_id !== userId))
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true)
      else console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser) return
    setFollowLoading(true)
    try {
      const res = await api.put(`/users/${userId}/follow`)
      setIsFollowing(res.data.isFollowing)
      setFollowersCount(res.data.followersCount)
    } catch (err) {
      console.error('Follow error', err)
    } finally {
      setFollowLoading(false)
    }
  }

  const totalLikes = posts.reduce((s, p) => s + (p.likes?.length || 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.comments?.length || 0), 0)

  if (loading) {
    return (
      <div className="loading-spinner"><div className="spinner" /></div>
    )
  }

  if (notFound) {
    return (
      <div className="empty-state" style={{ marginTop: '60px' }}>
        <div className="empty-icon">🔍</div>
        <h3>User not found</h3>
        <p>No user with the username <strong>@{userId}</strong> exists.</p>
        <button className="btn-post" style={{ marginTop: '20px' }} onClick={() => navigate('/feed')}>
          Back to Feed
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'transparent', color: 'var(--text-secondary)',
          fontSize: '0.875rem', padding: '8px 0', marginBottom: '12px',
          border: 'none', cursor: 'pointer',
        }}
      >
        ← Back
      </button>

      <div className="profile-header">
        <div
          className="profile-avatar"
          style={{
            background: profile?.profileImage ? 'transparent' : (profile?.avatarColor || 'linear-gradient(135deg, #58a6ff, #bc8cff)'),
            overflow: 'hidden',
          }}
        >
          {profile?.profileImage
            ? <img src={profile.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : profile?.user_id?.[0]?.toUpperCase()
          }
        </div>

        <div className="profile-info">
          {profile?.name && <h1 className="profile-display-name">{profile.name}</h1>}
          <h2 className="profile-userId">@{profile?.user_id}</h2>
          {profile?.bio && (
            <div className="profile-bio">{profile.bio}</div>
          )}
          <div className="profile-email">
            📅 Joined {new Date(profile?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          {mutualFollowers.length > 0 && (
            <div className="mutual-followers">
              👤 Followed by {mutualFollowers.map((m, i) => (
                <span key={m._id || i} className="mutual-name">
                  @{m.user_id}{i < mutualFollowers.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '14px' }}>
          {/* Follow / Unfollow button (hide on own profile) */}
          {!isOwnProfile && (
            <button
              className={`btn-follow ${isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading
                ? '...'
                : isFollowing
                ? '✅ Following'
                : '➕ Follow'}
            </button>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="profile-stats">
              <div className="stat-num">{posts.length}</div>
              <div className="stat-label">Posts</div>
            </div>
            <div className="profile-stats">
              <div className="stat-num">{followersCount}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="profile-stats">
              <div className="stat-num">{profile?.followingCount || 0}</div>
              <div className="stat-label">Following</div>
            </div>
            <div className="profile-stats">
              <div className="stat-num">{totalLikes}</div>
              <div className="stat-label">Likes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Row for Profile */}
      {!isOwnProfile && suggestions.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SuggestionRow suggestions={suggestions} />
        </div>
      )}

      <div className="section-divider">Posts by @{profile?.user_id}</div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💻</div>
          <h3>No posts yet</h3>
          <p>@{profile?.user_id} hasn't shared any code yet.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))
      )}
    </div>
  )
}
