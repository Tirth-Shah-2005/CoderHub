import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ user_id: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!form.user_id || !form.email || !form.password) {
          setError('All fields are required')
          setLoading(false)
          return
        }
        const res = await api.post('/auth/register', {
          user_id: form.user_id,
          email: form.email,
          password: form.password,
        })
        login(res.data.user, res.data.token)
        navigate('/feed')
      } else {
        if (!form.user_id || !form.password) {
          setError('user_id/email and password are required')
          setLoading(false)
          return
        }
        const res = await api.post('/auth/login', {
          identifier: form.user_id,
          password: form.password,
        })
        login(res.data.user, res.data.token)
        navigate('/feed')
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setForm({ user_id: '', email: '', password: '' })
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-glow top" />
      <div className="auth-bg-glow bottom" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">{'</>'}</div>
          <h1>CoderHub</h1>
          <p>Where code meets community</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="error-msg">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {mode === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <input
              className="form-input"
              type="text"
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              placeholder={mode === 'login' ? '@username or email' : '@your_username'}
              autoComplete="username"
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading
              ? '⏳ Please wait...'
              : mode === 'login'
              ? '🚀 Sign In'
              : '🎉 Create My Account'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            style={{
              background: 'none',
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: 0,
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
