import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../services/api'
import './Auth.css'

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const email = formData.email.trim().toLowerCase()
    const isGmail =
      email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')
    if (!isGmail) {
      setError('Student registration requires a Gmail address.')
      setLoading(false)
      return
    }

    try {
      const res = await API.post('/auth/register', formData)
      const otpParam = res.data?.debugOtp
        ? `&otp=${encodeURIComponent(res.data.debugOtp)}`
        : ''
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}${otpParam}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        <p className="subtitle">Student registration only.</p>
        <p className="helper-text">
          Teachers/Admins are added by the super admin. Use a Gmail address to
          receive OTP.
        </p>
        <div className="staff-login">
          <p>Staff access</p>
          <div className="staff-actions">
            <Link to="/login?role=teacher" className="btn btn-secondary">
              Teacher Login
            </Link>
            <Link to="/login?role=admin" className="btn btn-secondary">
              Admin Login
            </Link>
            <Link to="/login?role=superadmin" className="btn btn-secondary">
              Super Admin Login
            </Link>
          </div>
        </div>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
            autoComplete="off"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
            autoComplete="off"
          />
          <input
            type="email"
            name="email"
            placeholder="student@gmail.com"
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
            autoComplete="new-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
