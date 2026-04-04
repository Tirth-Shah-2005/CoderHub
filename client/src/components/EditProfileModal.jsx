import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #58a6ff, #bc8cff)',
  'linear-gradient(135deg, #3fb950, #58a6ff)',
  'linear-gradient(135deg, #ffa657, #f85149)',
  'linear-gradient(135deg, #e3b341, #ffa657)',
  'linear-gradient(135deg, #bc8cff, #f85149)',
  'linear-gradient(135deg, #79dcff, #3fb950)',
  'linear-gradient(135deg, #f85149, #bc8cff)',
  'linear-gradient(135deg, #58a6ff, #3fb950)',
]

export default function EditProfileModal({ currentBio, currentAvatarColor, currentProfileImage, onSave, onClose }) {
  const { user, login } = useAuth()
  const token = localStorage.getItem('coderhub_token')
  const [bio, setBio] = useState(currentBio || '')
  const [avatarColor, setAvatarColor] = useState(currentAvatarColor || AVATAR_COLORS[0])
  const [profileImage, setProfileImage] = useState(currentProfileImage || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setProfileImage(ev.target.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.put('/users/profile/edit', { bio, avatarColor, profileImage })
      login({ ...user, bio: res.data.bio, avatarColor: res.data.avatarColor, profileImage: res.data.profileImage }, token)
      onSave(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3>✏️ Edit Profile</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Avatar Preview with pen icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Circle avatar */}
            <div
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: profileImage ? 'transparent' : avatarColor,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: '24px', color: 'white',
                boxShadow: '0 0 16px rgba(88,166,255,0.2)',
                overflow: 'hidden',
              }}
            >
              {profileImage
                ? <img src={profileImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : user?.user_id?.[0]?.toUpperCase()
              }
            </div>

            {/* Pen edit button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'var(--accent-primary)', border: '2px solid var(--bg-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '11px', color: 'white',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              ✏️
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>@{user?.user_id}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              {bio || <span style={{ color: 'var(--text-muted)' }}>No bio yet...</span>}
            </div>
            {profileImage && (
              <button
                onClick={() => setProfileImage('')}
                style={{
                  marginTop: '6px', background: 'none', border: 'none',
                  color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer',
                  textDecoration: 'underline', padding: 0,
                }}
              >
                ✕ Remove photo
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-msg"><span>⚠</span> {error}</div>}

        {/* Bio */}
        <div className="form-group">
          <label className="form-label">📝 Bio</label>
          <textarea
            className="caption-input"
            placeholder="Tell the world about yourself as a coder..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bio.length}/200</span>
        </div>

        {/* Avatar Color - only visible if no image uploaded */}
        {!profileImage && (
          <div className="form-group">
            <label className="form-label">🎨 Avatar Color</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: color, border: avatarColor === color ? '3px solid white' : '3px solid transparent',
                    boxShadow: avatarColor === color ? '0 0 12px rgba(88,166,255,0.5)' : 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                    transform: avatarColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn-action" onClick={onClose} style={{ border: '1px solid var(--border-color)', padding: '10px 20px' }}>
            Cancel
          </button>
          <button className="btn-post" onClick={handleSave} disabled={loading}>
            {loading ? '⏳ Saving...' : '✅ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
