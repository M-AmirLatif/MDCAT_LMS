import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import API from '../services/api'
import './Auth.css'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const navigate = useNavigate()
  const requestedRole = searchParams.get('role')
  const nextPath = searchParams.get('next')

  const roleLabels = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Admin',
    superadmin: 'Super Admin',
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await API.post('/auth/login', formData)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      if (nextPath) {
        navigate(nextPath)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed'
      setError(message)
      setNeedsVerification(message.toLowerCase().includes('not verified'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>
        <p className="subtitle">Welcome back. Continue your preparation.</p>
        {requestedRole && (
          <p className="info-message">
            This area needs a {roleLabels[requestedRole] || 'staff'} account.
            Login with the correct role.
          </p>
        )}
        {error && <p className="error-message">{error}</p>}
        {needsVerification && (
          <p className="subtitle">
            Please verify your email.{' '}
            <Link to={`/verify-email?email=${encodeURIComponent(formData.email)}`}>
              Verify now
            </Link>
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="off"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-links">
          <p>
            Student signup only? <Link to="/register">Register</Link>
          </p>
          <p>
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
