import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function NavbarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="nav-dropdown-container" ref={dropdownRef}>
      <button 
        className="nav-profile-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          padding: 0,
          border: 'none'
        }}
      >
        <Avatar user={user} size={28} />
      </button>

      {isOpen && (
        <div className="nav-dropdown-menu">
          <div className="dropdown-item profile-entry">
            <div className="nav-dropdown-header">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>@{user.user_id}</span>
                {user.name && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {user.name}
                  </span>
                )}
              </div>
              <NavLink to="/profile" className="view-profile-link" onClick={() => setIsOpen(false)}>
                View Profile
              </NavLink>
            </div>
          </div>

          {isProfilePage && (
            <>
              <div className="dropdown-divider" />
              <NavLink 
                to="/membership" 
                className="dropdown-item premium-gold" 
                onClick={() => setIsOpen(false)}
              >
                💎 <span>Membership</span>
              </NavLink>
              <NavLink 
                to="/settings" 
                className="dropdown-item" 
                onClick={() => setIsOpen(false)}
              >
                <span>⚙️ Settings</span>
              </NavLink>
              <button className="dropdown-item" onClick={() => setIsOpen(false)}>
                <span>🔄 Switch Account</span>
              </button>
            </>
          )}

          <div className="dropdown-divider" />

          <button className="dropdown-item logout-btn" onClick={handleLogout}>
            <span>🚪 Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
