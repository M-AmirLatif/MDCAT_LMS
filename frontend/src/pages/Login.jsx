import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getRememberedCredentials, setRememberedCredentials } from '../services/authStorage'
import './Auth.css'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login: storeLogin } = useAuth()
  const requestedRole = searchParams.get('role')
  const nextPath = searchParams.get('next')
  const googleBtnRef = useRef(null)
  const googleInitRef = useRef(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  const roleLabels = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Admin',
    superadmin: 'Super Admin',
  }

  useEffect(() => {
    const { email } = getRememberedCredentials()
    if (email) {
      setFormData((p) => ({ ...p, email }))
      setRemember(!!localStorage.getItem('remember_email'))
    }
  }, [])

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || !googleBtnRef.current || googleInitRef.current) return

    const existing = document.querySelector('script[data-google-identity]')
    const script = existing || document.createElement('script')
    if (!existing) {
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
      document.head.appendChild(script)
    }

    const onReady = () => {
      if (googleInitRef.current) return
      if (!window.google?.accounts?.id) return

      googleInitRef.current = true

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const res = await API.post('/auth/google', { credential })
            storeLogin(res.data.token, res.data.user, remember)
            if (remember) {
              setRememberedCredentials({
                email: res.data.user?.email || '',
                remember,
              })
            }
            navigate(nextPath || '/dashboard')
          } catch (e) {
            const msg = e.response?.data?.error || 'Google login failed'
            toast.error(msg)
          }
        },
      })

      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: 420,
        text: 'signin_with',
      })
    }

    script.addEventListener('load', onReady)
    if (window.google?.accounts?.id) onReady()

    return () => script.removeEventListener('load', onReady)
  }, [navigate, nextPath, remember, storeLogin])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsVerification(false)
    setOtpSent(false)

    try {
      const email = emailRef.current?.value || formData.email
      const password = passwordRef.current?.value || formData.password
      const res = await API.post('/auth/login', { email, password })
      storeLogin(res.data.token, res.data.user, remember)
      setRememberedCredentials({
        email,
        remember,
      })
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

  const handleSendOtp = async () => {
    const email = (emailRef.current?.value || formData.email || '').trim()
    if (!email) {
      toast.error('Enter your email first')
      return
    }

    setOtpLoading(true)
    try {
      await API.post('/auth/resend-otp', { email })
      setOtpSent(true)
      toast.success('OTP sent to your email')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const email = (emailRef.current?.value || formData.email || '').trim()
    if (!email || !otp.trim()) {
      toast.error('Enter email and OTP')
      return
    }

    setOtpLoading(true)
    try {
      await API.post('/auth/verify-email', { email, otp: otp.trim() })
      toast.success('Email verified. You can sign in now.')
      setNeedsVerification(false)
      setOtpSent(false)
      setOtp('')
    } catch (e) {
      toast.error(e.response?.data?.error || 'OTP verification failed')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <div className="auth-mark" aria-hidden="true" />
            <span className="auth-brand-name">MDCAT LMS</span>
          </div>

          <div className="auth-card">
            <h1 className="auth-title">Log in</h1>
            <p className="auth-subtitle">Welcome back! Please enter your details.</p>

            {requestedRole && (
              <p className="info-message">
                This area needs a {roleLabels[requestedRole] || 'staff'} account.
                Login with the correct role.
              </p>
            )}
            {error && <p className="error-message">{error}</p>}
            {needsVerification && (
              <p className="auth-hint">
                Your email is not verified. Send an OTP and verify to continue.
              </p>
            )}

            <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onInput={handleChange}
                  ref={emailRef}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  inputMode="email"
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-with-button">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onInput={handleChange}
                    ref={passwordRef}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {needsVerification && (
                <div className="otp-inline">
                  <div className="otp-row">
                    <button
                      type="button"
                      className="auth-secondary"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                  </div>

                  {otpSent && (
                    <div className="field">
                      <label htmlFor="otp">OTP</label>
                      <div className="input-with-button">
                        <input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter the OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          autoComplete="one-time-code"
                        />
                        <button
                          type="button"
                          className="input-action"
                          onClick={handleVerifyOtp}
                          disabled={otpLoading}
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="auth-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Remember for 30 days</span>
                </label>

                <Link className="auth-link" to="/forgot-password">
                  Forgot password
                </Link>
              </div>

              <button className="auth-primary" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="google-wrap">
                {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <div ref={googleBtnRef} />
                ) : (
                  <button
                    className="auth-secondary"
                    type="button"
                    onClick={() =>
                      toast.error(
                        'Missing VITE_GOOGLE_CLIENT_ID (Google login not configured).',
                      )
                    }
                  >
                    <span className="google-dot" aria-hidden="true" />
                    Sign in with Google
                  </button>
                )}
              </div>

              <p className="auth-footer">
                Don’t have an account? <Link to="/register">Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <aside className="auth-right" aria-hidden="true">
        <div className="auth-right-inner">
          <div className="mock-canvas">
            <div className="mock-card mock-card--left">
              <div className="mock-card-title">Daily MDCAT Plan</div>
              <div className="mock-pill">Consistency wins</div>
              <div className="mock-search" />
              <div className="mock-user">
                <div className="mock-avatar" />
                <div className="mock-lines">
                  <div className="mock-line" />
                  <div className="mock-line short" />
                </div>
              </div>
              <div className="mock-user">
                <div className="mock-avatar" />
                <div className="mock-lines">
                  <div className="mock-line" />
                  <div className="mock-line short" />
                </div>
              </div>
            </div>

            <div className="mock-card mock-card--right">
              <div className="mock-badge">On Track</div>
              <div className="mock-card-title">High‑Yield Practice</div>
              <div className="mock-pill">Strong basics, higher score</div>
              <div className="mock-search" />
              <div className="mock-user">
                <div className="mock-avatar accent" />
                <div className="mock-lines">
                  <div className="mock-line" />
                  <div className="mock-line short" />
                </div>
              </div>
            </div>
          </div>

          <div className="auth-right-copy">
            <h2>Your MDCAT journey starts here</h2>
            <p>Sign in to practice daily, track progress, and stay consistent.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
