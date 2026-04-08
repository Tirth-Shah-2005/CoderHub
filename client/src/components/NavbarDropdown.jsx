import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
          background: user.profileImage ? 'transparent' : (user.avatarColor || 'var(--accent)'),
          border: '2px solid var(--border-color)'
        }}
      >
        {user.profileImage 
          ? <img src={user.profileImage} alt="profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : user.user_id?.[0]?.toUpperCase()
        }
      </button>

      {isOpen && (
        <div className="nav-dropdown-menu">
          <NavLink 
            to="/profile" 
            className="dropdown-item profile-entry" 
            onClick={() => setIsOpen(false)}
          >
            <div className="dropdown-profile-info">
              <span className="dropdown-username">@{user.user_id}</span>
              <span className="dropdown-view-profile">View Profile</span>
            </div>
          </NavLink>

          {isProfilePage && (
            <>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => setIsOpen(false)}>
                <span>💎 Membership</span>
              </button>
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
