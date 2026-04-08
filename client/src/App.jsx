import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import SettingsPage from './pages/SettingsPage'
import Navbar from './components/Navbar'

import ActivityListPage from './pages/ActivityListPage'
import MembershipPage from './pages/MembershipPage'

function App() {
  const { user } = useAuth()

  return (
    <div className="app">
      {user && <Navbar />}
      <div className={user ? 'main-content' : ''}>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/home" replace /> : <AuthPage />}
          />
          <Route
            path="/home"
            element={user ? <HomePage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/settings"
            element={user ? <SettingsPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/settings/liked"
            element={user ? <ActivityListPage type="liked" /> : <Navigate to="/" replace />}
          />
          <Route
            path="/settings/commented"
            element={user ? <ActivityListPage type="commented" /> : <Navigate to="/" replace />}
          />
          <Route
            path="/settings/saved"
            element={user ? <ActivityListPage type="saved" /> : <Navigate to="/" replace />}
          />
          <Route
            path="/membership"
            element={user ? <MembershipPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/feed"
            element={user ? <FeedPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/profile"
            element={user ? <ProfilePage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/user/:userId"
            element={user ? <UserProfilePage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
