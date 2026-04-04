import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import Navbar from './components/Navbar'

function App() {
  const { user } = useAuth()

  return (
    <div className="app">
      {user && <Navbar />}
      <div className={user ? 'main-content' : ''}>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/feed" replace /> : <AuthPage />}
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
