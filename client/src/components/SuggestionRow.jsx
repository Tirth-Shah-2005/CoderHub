import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function isAccountNew(createdAt) {
  if (!createdAt) return false
  const diff = Date.now() - new Date(createdAt).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000
}

export default function SuggestionRow({ suggestions: initialSuggestions }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const navigate = useNavigate()

  const handleFollow = async (e, user_id, index) => {
    e.stopPropagation()
    try {
      await api.put(`/users/${user_id}/follow`)
      // Remove from suggestions after following
      setSuggestions(prev => prev.filter((_, i) => i !== index))
    } catch (err) {
      console.error('Follow error', err)
    }
  }

  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="suggestion-row-container">
      <div className="suggestion-row-header">
        <span className="suggestion-row-title">People you might know</span>
      </div>
      <div className="suggestion-scroll">
        {suggestions.map((user, i) => (
          <div 
            key={user._id} 
            className="suggestion-card"
            onClick={() => navigate(`/user/${user.user_id}`)}
          >
            <div 
              className="suggestion-avatar"
              style={{
                background: user.profileImage ? 'transparent' : (user.avatarColor || 'var(--accent-color)'),
                overflow: 'hidden'
              }}
            >
              {user.profileImage 
                ? <img src={user.profileImage} alt="avg" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                : user.user_id?.[0]?.toUpperCase() 
              }
            </div>
            
            <div className="suggestion-info">
              <div className="suggestion-id">
                @{user.user_id}
                {isAccountNew(user.createdAt) && <span className="new-badge">New</span>}
              </div>
              <div className="suggestion-bio">{user.bio || 'CoderHub member'}</div>
            </div>

            <button 
              className="btn-follow-sm"
              onClick={(e) => handleFollow(e, user.user_id, i)}
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
