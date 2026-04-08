import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import SearchBar from './SearchBar'
import NotificationBell from './NotificationBell'
import NavbarDropdown from './NavbarDropdown'

export default function Navbar() {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  const showSearch = location.pathname === '/feed'

  return (
    <nav className="navbar">
      <div className="nav-left">
        <NavLink to="/home" className="navbar-logo" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">{'</>'}</div>
          CoderHub
        </NavLink>
      </div>

      <div className="nav-center">
        <div className="nav-main-links">
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            to="/home"
          >
            🏠 Home
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            to="/feed"
          >
            🌐 Feed
          </NavLink>
        </div>
        {showSearch && <SearchBar />}
      </div>

      <div className="nav-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          <div className="theme-toggle-track">
            <div className="theme-toggle-thumb">{isDark ? '🌙' : '☀️'}</div>
          </div>
        </button>

        <NotificationBell />

        {user && (
          <div className="nav-profile-section">
            <NavbarDropdown />
          </div>
        )}
      </div>
    </nav>
  )
}
