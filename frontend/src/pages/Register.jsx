import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [autofillGuard, setAutofillGuard] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [debugOtp, setDebugOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login: storeLogin } = useAuth()
  const googleBtnRef = useRef(null)
  const googleInitRef = useRef(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  const unlockAutofill = (e) => {
    if (!autofillGuard) return
    setAutofillGuard(false)
    if (e?.currentTarget) e.currentTarget.readOnly = false
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

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
            storeLogin(res.data.token, res.data.user, true)
            navigate('/dashboard')
          } catch (e) {
            const msg = e.response?.data?.error || 'Google sign-up failed'
            if (String(msg).toLowerCase().includes('not configured')) {
              toast.error('Google login not configured on server (set GOOGLE_CLIENT_ID in backend/.env).')
            } else {
              toast.error(msg)
            }
          }
        },
      })

      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: 420,
        text: 'signup_with',
      })
    }

    script.addEventListener('load', onReady)
    if (window.google?.accounts?.id) onReady()

    return () => script.removeEventListener('load', onReady)
  }, [navigate, storeLogin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOtpSent(false)
    setOtp('')
    setDebugOtp('')

    const email = (emailRef.current?.value || formData.email).trim().toLowerCase()
    const isGmail =
      email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')
    if (!isGmail) {
      setError('Student registration requires a Gmail address.')
      setLoading(false)
      return
    }

    try {
      const res = await API.post('/auth/register', {
        ...formData,
        email,
        password: passwordRef.current?.value || formData.password,
      })
      setOtpSent(true)
      if (res.data?.debugOtp) {
        setDebugOtp(String(res.data.debugOtp))
        setOtp(String(res.data.debugOtp))
      }
      toast.success('OTP sent to your email')
    } catch (err) {
      const isTimeout =
        err?.code === 'ECONNABORTED' ||
        String(err?.message || '').toLowerCase().includes('timeout')
      if (isTimeout) {
        setError(
          'Request timed out while sending OTP. Please try again (or use Resend OTP).',
        )
      } else {
        setError(err.response?.data?.error || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    const email = (emailRef.current?.value || formData.email).trim().toLowerCase()
    if (!email) {
      toast.error('Enter your email first')
      return
    }

    setOtpLoading(true)
    try {
      const res = await API.post('/auth/resend-otp', { email })
      if (res.data?.debugOtp) {
        setDebugOtp(String(res.data.debugOtp))
        setOtp(String(res.data.debugOtp))
      }
      toast.success('OTP resent')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const email = (emailRef.current?.value || formData.email).trim().toLowerCase()
    if (!email || !otp.trim()) {
      toast.error('Enter email and OTP')
      return
    }

    setOtpLoading(true)
    try {
      await API.post('/auth/verify-email', { email, otp: otp.trim() })
      toast.success('Email verified. Signing you in...')
      try {
        const password = passwordRef.current?.value || formData.password
        const loginRes = await API.post('/auth/login', { email, password })
        storeLogin(loginRes.data.token, loginRes.data.user, true)
        navigate('/dashboard')
      } catch {
        navigate('/login')
      }
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
            <h1 className="auth-title">Sign up</h1>
            <p className="auth-subtitle">Create your student account to start learning.</p>

            <div className="staff-cta" aria-label="Staff login shortcuts">
              <div className="staff-cta-title">Staff login</div>
              <div className="staff-cta-grid">
                <Link to="/login?role=teacher" className="staff-cta-btn">
                  Teacher Login
                </Link>
                <Link to="/login?role=admin" className="staff-cta-btn">
                  Admin Login
                </Link>
                <Link to="/login?role=superadmin" className="staff-cta-btn">
                  Super Admin Login
                </Link>
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
              <div className="field-row">
                <div className="field">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="regEmail">Email</label>
                <input
                  id="regEmail"
                  type="email"
                  name="email"
                  placeholder="student@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  onInput={handleChange}
                  ref={emailRef}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  inputMode="email"
                  readOnly={autofillGuard}
                  onPointerDown={unlockAutofill}
                  onFocus={unlockAutofill}
                />
              </div>

              <div className="field">
                <label htmlFor="regPassword">Password</label>
                <div className="input-with-icon">
                  <input
                    id="regPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    onInput={handleChange}
                    ref={passwordRef}
                    required
                    autoComplete="new-password"
                    readOnly={autofillGuard}
                    onPointerDown={unlockAutofill}
                    onFocus={unlockAutofill}
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 3l18 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.6 10.6a3 3 0 004.24 4.24"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9.88 5.08A10.46 10.46 0 0112 4.75c7.5 0 10.5 7.25 10.5 7.25a17.23 17.23 0 01-3.41 4.66"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6.11 6.11C3.36 8.2 1.5 12 1.5 12S4.5 19.25 12 19.25c1.6 0 3.02-.33 4.27-.87"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M1.5 12S4.5 4.75 12 4.75 22.5 12 22.5 12 19.5 19.25 12 19.25 1.5 12 1.5 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 15.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="otp-inline">
                  {debugOtp && (
                    <p className="debug-otp">
                      Debug OTP (dev): <strong>{debugOtp}</strong>
                    </p>
                  )}
                  <div className="otp-row">
                    <button
                      type="button"
                      className="auth-secondary"
                      onClick={handleResendOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? 'Resending...' : 'Resend OTP'}
                    </button>
                  </div>
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

                </div>
              )}

              <button className="auth-primary" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <div className="google-wrap">
                {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <div ref={googleBtnRef} />
                ) : (
                  <button
                    className="auth-secondary"
                    type="button"
                    onClick={() =>
                      toast.error('Missing VITE_GOOGLE_CLIENT_ID (Google login not configured).')
                    }
                  >
                    <span className="google-dot" aria-hidden="true" />
                    Continue with Google
                  </button>
                )}
              </div>

              <p className="auth-footer">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <aside className="auth-right" aria-hidden="true">
        <div className="auth-right-inner">
          <div className="mock-canvas">
            <div className="mock-card mock-card--left">
              <div className="mock-card-title">MDCAT Study Plan</div>
              <div className="mock-pill">One day at a time</div>
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
              <div className="mock-badge">Focus</div>
              <div className="mock-card-title">Mock Tests & Review</div>
              <div className="mock-pill">Learn faster from mistakes</div>
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
            <h2>Build your MDCAT momentum</h2>
            <p>Sign up to practice smarter, revise better, and improve daily.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
