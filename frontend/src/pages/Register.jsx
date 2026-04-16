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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login: storeLogin } = useAuth()
  const googleBtnRef = useRef(null)
  const googleInitRef = useRef(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

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

    const email = (emailRef.current?.value || formData.email).trim().toLowerCase()
    const isGmail =
      email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')
    if (!isGmail) {
      setError('Student registration requires a Gmail address.')
      setLoading(false)
      return
    }

    try {
      await API.post('/auth/register', {
        ...formData,
        email,
        password: passwordRef.current?.value || formData.password,
      })
      setOtpSent(true)
      toast.success('OTP sent to your email')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
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
      toast.success('Email verified. You can log in now.')
      navigate('/login')
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
            <p className="auth-hint">
              Teachers/Admins are added by the super admin. Use a Gmail address to receive OTP.
            </p>

            <div className="staff-strip" aria-label="Staff access">
              <Link to="/login?role=teacher" className="chip">
                Teacher Login
              </Link>
              <Link to="/login?role=admin" className="chip">
                Admin Login
              </Link>
              <Link to="/login?role=superadmin" className="chip">
                Super Admin Login
              </Link>
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
                />
              </div>

              <div className="field">
                <label htmlFor="regPassword">Password</label>
                <div className="input-with-button">
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

              {otpSent && (
                <div className="otp-inline">
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

                  <button
                    type="button"
                    className="auth-secondary"
                    onClick={async () => {
                      const email = (emailRef.current?.value || formData.email).trim()
                      if (!email) return toast.error('Enter your email first')
                      setOtpLoading(true)
                      try {
                        await API.post('/auth/resend-otp', { email })
                        toast.success('OTP resent')
                      } catch (e) {
                        toast.error(e.response?.data?.error || 'Failed to resend OTP')
                      } finally {
                        setOtpLoading(false)
                      }
                    }}
                    disabled={otpLoading}
                  >
                    Resend OTP
                  </button>
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
                    Sign up with Google
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
