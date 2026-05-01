import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import { clearRememberedCredentials, setRememberedCredentials } from '../services/authStorage'
import { getDefaultRouteForRole, getRoleLabel } from '../lib/platform'
import './Auth.css'
import './PlatformPages.css'

const otpTemplate = ['', '', '', '', '', '']

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M4 7h16v10H4V7Zm0 0 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M7 10V8a5 5 0 1 1 10 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  )
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const requestedRole = searchParams.get('role') || 'student'
  const nextPath = searchParams.get('next')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showOtpStep, setShowOtpStep] = useState(requestedRole === 'superadmin')
  const [otp, setOtp] = useState(otpTemplate)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    setShowOtpStep(requestedRole === 'superadmin')
  }, [requestedRole])

  const accentClass = useMemo(() => {
    if (requestedRole === 'teacher') return 'auth-shell--teal'
    if (requestedRole === 'admin') return 'auth-shell--amber'
    if (requestedRole === 'superadmin') return 'auth-shell--coral'
    return ''
  }, [requestedRole])

  const roleLabel = getRoleLabel(requestedRole)
  const emailValid = /\S+@\S+\.\S+/.test(formData.email)
  const passwordValid = formData.password.trim().length > 0

  const onChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const onOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    setOtp((current) => current.map((digit, digitIndex) => (digitIndex === index ? cleaned : digit)))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      if (requestedRole === 'superadmin' && otp.join('').length !== 6) {
        toast.error('Enter the 6-digit OTP to continue.')
        setLoading(false)
        return
      }

      const response = await API.post('/auth/login', formData)
      const user = response.data.user
      login(response.data.token, user, remember)
      if (remember) {
        setRememberedCredentials({ email: formData.email, remember })
      } else {
        clearRememberedCredentials()
      }

      navigate(nextPath || getDefaultRouteForRole(user?.role || requestedRole))
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className={`auth-shell ${accentClass}`}>
        <section className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-brand">
              <span className="auth-mark">M</span>
              <span className="auth-brand-name">MDCAT LMS</span>
            </div>

            <div className="auth-card auth-card--platform">
              <div className="auth-role-row">
                <span className={`badge ${requestedRole === 'teacher' ? 'badge-teal' : requestedRole === 'admin' ? 'badge-amber' : requestedRole === 'superadmin' ? 'badge-coral' : 'badge-purple'}`}>
                  {roleLabel}
                </span>
              </div>

              <h1 className="auth-title">Sign in to continue</h1>
              <p className="auth-subtitle">Access your prep workspace, progress metrics, and role-specific tools.</p>

              {requestedRole === 'superadmin' && (
                <div className="security-banner">
                  <strong>Security check:</strong>
                  <span>Super Admin login requires a 6-digit OTP after password verification.</span>
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-fields-panel">
                <div className={`floating-field auth-input-shell ${formData.email ? 'auth-input-shell--filled' : ''} ${emailValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><MailIcon /></span>
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={onChange} placeholder="admin@mdcat.pk" required />
                  {emailValid ? <span className="auth-valid-dot" aria-hidden="true" /> : null}
                </div>

                <div className={`floating-field auth-input-shell auth-password-field ${formData.password ? 'auth-input-shell--filled' : ''} ${passwordValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
                  <label htmlFor="password">Password</label>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={onChange} placeholder="Enter your password" required />
                  <button className="auth-inline-toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  {passwordValid ? <span className="auth-valid-dot auth-valid-dot--password" aria-hidden="true" /> : null}
                </div>
                </div>

                {showOtpStep && (
                  <div>
                    <label>OTP Verification</label>
                    <div className="otp-row">
                      {otp.map((digit, index) => (
                        <input
                          key={`otp-${index}`}
                          className="otp-box"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(event) => onOtpChange(index, event.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="auth-row">
                  <label className="checkbox auth-checkbox">
                    <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                    <span>Remember this device</span>
                  </label>
                  <Link className="auth-link" to="/forgot-password">Forgot password</Link>
                </div>

                <button className="auth-primary" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : requestedRole === 'superadmin' ? 'Verify and Sign In' : 'Sign In'}
                </button>

                {requestedRole === 'student' && (
                  <button
                    className="auth-secondary auth-google-pill"
                    type="button"
                    onClick={() => toast('Google sign-in is available when configured in environment variables.')}
                  >
                    Continue with Google
                  </button>
                )}

                <p className="auth-footer">
                  New here? <Link to="/register">Create account</Link>
                </p>
              </form>
            </div>
          </div>
        </section>

        <aside className="auth-right">
          <div className="auth-right-inner auth-preview">
            <div className="auth-preview-card auth-preview-card--floating">
              <div className="label-xs">Today&apos;s Snapshot</div>
              <h3>{roleLabel} workspace</h3>
              <p>Live classes, alerts, payments, and exam prep updates in one place.</p>
            </div>
            <div className="auth-preview-grid">
              <div className="auth-preview-mini">
                <strong>84%</strong>
                <span>Avg mock score</span>
              </div>
              <div className="auth-preview-mini">
                <strong>8 PM</strong>
                <span>Next revision class</span>
              </div>
              <div className="auth-preview-mini">
                <strong>28k+</strong>
                <span>Active learners</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
