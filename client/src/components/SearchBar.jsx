import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = async (val) => {
    setQuery(val)
    if (!val.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(val)}`)
      setResults(res.data)
      setOpen(true)
    } catch (err) {
      console.error('Search error', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (userId) => {
    setQuery('')
    setResults([])
    setOpen(false)
    navigate(`/user/${userId}`)
  }

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className="search-input-box">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <span className="search-spinner" />}
      </div>

      {open && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((user) => (
            <button
              key={user._id}
              className="search-result-item"
              onClick={() => handleSelect(user.user_id)}
            >
              <div
                className="search-result-avatar"
                style={{
                  background: user.profileImage ? 'transparent' : (user.avatarColor || 'linear-gradient(135deg, #58a6ff, #bc8cff)'),
                  overflow: 'hidden',
                }}
              >
                {user.profileImage
                  ? <img src={user.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : user.user_id[0]?.toUpperCase()
                }
              </div>
              <div className="search-result-info">
                <span className="search-result-uid">@{user.user_id}</span>
                {user.bio && <span className="search-result-bio">{user.bio}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query && results.length === 0 && !loading && (
        <div className="search-dropdown">
          <p className="search-no-result">No users found for "{query}"</p>
        </div>
      )}
    </div>
  )
}
