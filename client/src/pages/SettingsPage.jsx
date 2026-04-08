import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Settings & Activity</h1>
        <p>Manage your account and view your interactions</p>
      </div>

      <div className="settings-container" style={{ padding: '40px' }}>
        <div style={{ width: '100%' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 800 }}>📂 Your Activity</h2>
          
          <div className="settings-tabs" style={{ width: '100%', gap: '16px' }}>
            <NavLink to="/settings/liked" className="activity-nav-item">
              <span style={{ fontSize: '1.2rem' }}>❤️</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem' }}>Posts you've liked</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>View all code snippets you've appreciated</span>
              </div>
            </NavLink>

            <NavLink to="/settings/commented" className="activity-nav-item">
              <span style={{ fontSize: '1.2rem' }}>💬</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem' }}>Posts you've commented on</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Revisit discussions you've joined</span>
              </div>
            </NavLink>

            <NavLink to="/settings/saved" className="activity-nav-item">
              <span style={{ fontSize: '1.2rem' }}>🔖</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem' }}>Saved items</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Access your curated collection</span>
              </div>
            </NavLink>
          </div>

          <div className="dropdown-divider" style={{ margin: '40px 0' }} />

          <h2 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 800 }}>🔒 Account Privacy</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Account settings and privacy controls are coming soon in a future update 🚀.
          </p>
        </div>
      </div>
    </div>
  );
}
