import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import SearchBar from './SearchBar'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <NavLink to="/feed" className="navbar-logo" style={{ textDecoration: 'none' }}>
        <div className="logo-icon">{'</>'}</div>
        CoderHub
      </NavLink>

      {/* Search Bar - center */}
      <SearchBar />

      <div className="navbar-links">
        <NavLink
          to="/feed"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          🌐 Feed
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          👤 Profile
        </NavLink>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-thumb">
              {isDark ? '🌙' : '☀️'}
            </span>
          </span>
        </button>

        <div className="navbar-user">
          <div
            className="user-avatar"
            style={{
              background: user?.profileImage ? 'transparent' : (user?.avatarColor || 'linear-gradient(135deg, #58a6ff, #bc8cff)'),
              overflow: 'hidden',
            }}
          >
            {user?.profileImage
              ? <img src={user.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : user?.user_id?.[0]?.toUpperCase() || '?'
            }
          </div>
          <span className="user-name">@{user?.user_id}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </nav>
  )
}

