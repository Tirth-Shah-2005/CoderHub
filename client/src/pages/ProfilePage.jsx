import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import EditProfileModal from '../components/EditProfileModal'
import api from '../api/axios'

export default function ProfilePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 })
  const [profileData, setProfileData] = useState({
    bio: user?.bio || '',
    avatarColor: user?.avatarColor || 'linear-gradient(135deg, #58a6ff, #bc8cff)',
    profileImage: user?.profileImage || '',
  })

  useEffect(() => {
    if (user?.user_id) fetchAll()
  }, [user?.user_id])

  const fetchAll = async () => {
    setLoading(true)
    try {
      // Fetch posts and follow stats together
      const [postsRes, profileRes] = await Promise.all([
        api.get(`/posts/user/${user.user_id}`),
        api.get(`/users/${user.user_id}`),
      ])
      setPosts(postsRes.data)
      setFollowStats({
        followersCount: profileRes.data.user.followersCount || 0,
        followingCount: profileRes.data.user.followingCount || 0,
      })
      setProfileData({
        bio: profileRes.data.user.bio || '',
        avatarColor: profileRes.data.user.avatarColor || 'linear-gradient(135deg, #58a6ff, #bc8cff)',
        profileImage: profileRes.data.user.profileImage || '',
      })
    } catch (err) {
      console.error('Failed to fetch profile', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId))
  }

  const handleProfileSaved = (updatedUser) => {
    setProfileData({
      bio: updatedUser.bio,
      avatarColor: updatedUser.avatarColor,
      profileImage: updatedUser.profileImage || '',
    })
    // Update avatar on all loaded posts so cards update instantly
    setPosts((prev) =>
      prev.map((post) => ({
        ...post,
        author: { ...post.author, avatarColor: updatedUser.avatarColor, profileImage: updatedUser.profileImage || '' },
      }))
    )
  }


  return (
    <div>
      <div className="profile-header">
        <div
          className="profile-avatar"
          style={{
            background: profileData.profileImage ? 'transparent' : profileData.avatarColor,
            overflow: 'hidden',
          }}
        >
          {profileData.profileImage
            ? <img src={profileData.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : user?.user_id?.[0]?.toUpperCase()
          }
        </div>

        <div className="profile-info">
          <h2>@{user?.user_id}</h2>
          <div className="profile-uid">✉️ {user?.email}</div>
          {profileData.bio ? (
            <div className="profile-bio">{profileData.bio}</div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
              No bio yet — click Edit to add one
            </div>
          )}

        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
          <button className="btn-edit-profile" onClick={() => setShowEdit(true)}>
            ✏️ Edit Profile
          </button>

          <div style={{ display: 'flex', gap: '18px' }}>
            <div className="profile-stats">
              <div className="stat-num">{posts.length}</div>
              <div className="stat-label">Posts</div>
            </div>
            <div className="profile-stats">
              <div className="stat-num">{followStats.followersCount}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="profile-stats">
              <div className="stat-num">{followStats.followingCount}</div>
              <div className="stat-label">Following</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider">My Posts</div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚀</div>
          <h3>No posts yet</h3>
          <p>Head to the feed and share your first code snippet!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post._id} post={post} onDelete={handleDelete} />
        ))
      )}

      {showEdit && (
        <EditProfileModal
          currentBio={profileData.bio}
          currentAvatarColor={profileData.avatarColor}
          currentProfileImage={profileData.profileImage}
          onSave={handleProfileSaved}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
