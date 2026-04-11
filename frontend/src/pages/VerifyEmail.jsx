import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import API from '../services/api'
import './Auth.css'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const initialOtp = searchParams.get('otp') || ''
  const [otp, setOtp] = useState(initialOtp)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await API.post('/auth/verify-email', { email, otp })
      setSuccess(res.data?.message || 'Email verified successfully')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    setSuccess('')

    try {
      const res = await API.post('/auth/resend-otp', { email })
      if (res.data?.debugOtp) {
        setOtp(res.data.debugOtp)
        setSuccess(
          `${res.data?.message || 'OTP generated'}. DEV OTP: ${res.data.debugOtp}`,
        )
      } else {
        setSuccess(res.data?.message || 'OTP resent successfully')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Verify Email</h2>
        <p className="subtitle">
          Enter the OTP sent to your email to activate your account.
        </p>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleVerify}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="auth-actions">
          <button type="button" onClick={handleResend} disabled={resending || !email}>
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
