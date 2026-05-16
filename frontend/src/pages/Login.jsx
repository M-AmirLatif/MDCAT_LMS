import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getDefaultRouteForRole, getRoleLabel } from '../lib/platform'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import {
  clearRememberedCredentials,
  getRememberedCredentials,
  setRememberedCredentials,
} from '../services/authStorage'
import ThemeToggle from '../components/ThemeToggle'
import './Auth.css'

const loginRoles = [
  { key: 'student', label: 'Student', hint: 'Practice MCQs' },
  { key: 'teacher', label: 'Teacher', hint: 'Manage MCQs' },
  { key: 'admin', label: 'Admin', hint: 'Operations' },
  { key: 'superadmin', label: 'Super Admin', hint: 'Control' },
]

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h16v10H4V7Zm0 0 8 6 8-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 10V8a5 5 0 1 1 10 0v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  )
}

export default function Login() {
  const rememberedCredentials = getRememberedCredentials()
  const [searchParams] = useSearchParams()
  const requestedRole = searchParams.get('role') || 'student'
  const nextPath = searchParams.get('next')
  const [formData, setFormData] = useState({
    email: rememberedCredentials.email || '',
    password: '',
  })
  const [remember, setRemember] = useState(rememberedCredentials.remember)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editableFields, setEditableFields] = useState({
    email: !!rememberedCredentials.email,
    password: false,
  })
  const navigate = useNavigate()
  const { login } = useAuth()

  // mode:'signin' — existing Google user → login; new Google user → toast + /register
  const googleSignIn = useGoogleSignIn({ remember, nextPath, mode: 'signin' })

  const accentClass = useMemo(() => {
    if (requestedRole === 'teacher') return 'auth-shell--teal'
    if (requestedRole === 'admin') return 'auth-shell--amber'
    if (requestedRole === 'superadmin') return 'auth-shell--coral'
    return ''
  }, [requestedRole])

  const roleLabel = getRoleLabel(requestedRole)
  const emailValid = /\S+@\S+\.\S+/.test(formData.email)
  const passwordValid = formData.password.trim().length > 0

  const switchRole = (role) => {
    const params = new URLSearchParams(searchParams)
    if (role === 'student') {
      params.delete('role')
    } else {
      params.set('role', role)
    }
    const query = params.toString()
    navigate(`/login${query ? `?${query}` : ''}`, { replace: true })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await API.post('/auth/login', formData)
      const user = response.data.user

      // Role mismatch check (superadmin can access any role)
      if (
        requestedRole !== 'student' &&
        user?.role !== requestedRole &&
        user?.role !== 'superadmin'
      ) {
        toast.error(
          `This account is a ${getRoleLabel(user?.role)} account, not ${roleLabel}.`,
        )
        setLoading(false)
        return
      }

      // If account needs password setup (shouldn't happen via email login, but guard anyway)
      if (user?.needsPasswordSetup) {
        if (remember || formData.email) {
          setRememberedCredentials({ email: formData.email, remember })
        } else {
          clearRememberedCredentials()
        }
        login(response.data.token, user, remember)
        navigate('/set-password', { replace: true })
        return
      }

      if (remember || formData.email) {
        setRememberedCredentials({ email: formData.email, remember })
      } else {
        clearRememberedCredentials()
      }
      login(response.data.token, user, remember)
      navigate(nextPath || getDefaultRouteForRole(user?.role || requestedRole))
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.error

      if (status === 403 && message?.includes('Google sign-in')) {
        // Google-only account trying email login
        toast.error(message)
      } else {
        toast.error(
          message ||
            (error.code === 'ECONNABORTED'
              ? 'Backend request timed out. Check Railway deployment.'
              : error.message === 'Network Error'
                ? 'Cannot reach backend API. Check Vercel API URL and Railway CORS.'
                : 'Login failed'),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className={`auth-shell ${accentClass}`}>
        <section className="auth-brand-panel">
          <div className="auth-dark-grid" />
          <div className="auth-brand auth-brand--dark">
            <span className="auth-mark">M</span>
            <span className="auth-brand-name">MDCAT LMS</span>
          </div>
          <div className="auth-mobile-stat">
            <i />
            MDCAT Prep
          </div>
          <div className="auth-brand-content">
            <div className="label-xs auth-kicker">
              Your MDCAT Prep Companion
            </div>
            <h1>Sign in to continue</h1>
            <p>
              Access your prep workspace, progress metrics, and role-specific
              tools.
            </p>

            <div className="auth-role-switcher" aria-label="Choose login role">
              {loginRoles.map((role) => (
                <button
                  key={role.key}
                  className={`auth-role-option ${requestedRole === role.key ? 'auth-role-option--active' : ''}`}
                  type="button"
                  onClick={() => switchRole(role.key)}
                >
                  <strong>{role.label}</strong>
                  <span>{role.hint}</span>
                </button>
              ))}
            </div>

            <div className="auth-stat-row">
              <div>
                <strong>4</strong>
                <span>Subjects</span>
              </div>
              <div>
                <strong>Live</strong>
                <span>Classes</span>
              </div>
              <div>
                <strong>Free</strong>
                <span>MCQ Bank</span>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <ThemeToggle className="theme-toggle--auth" />
          <div className="auth-left-inner">
            <div className="auth-card auth-card--platform">
              <div className="auth-role-row">
                <span
                  className={`badge ${requestedRole === 'teacher' ? 'badge-teal' : requestedRole === 'admin' ? 'badge-amber' : requestedRole === 'superadmin' ? 'badge-coral' : 'badge-purple'}`}
                >
                  {roleLabel}
                </span>
              </div>

              <h1 className="auth-title">Sign in to continue</h1>
              <p className="auth-subtitle">
                Access your prep workspace, progress metrics, and role-specific
                tools.
              </p>

              <form
                className="auth-form"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                <div
                  className={`floating-field auth-input-shell ${formData.email ? 'auth-input-shell--filled' : ''} ${emailValid ? 'auth-input-shell--valid' : ''}`}
                >
                  <span className="auth-input-icon" aria-hidden="true">
                    <MailIcon />
                  </span>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    onMouseDown={() =>
                      setEditableFields((current) => ({
                        ...current,
                        email: true,
                      }))
                    }
                    onTouchStart={() =>
                      setEditableFields((current) => ({
                        ...current,
                        email: true,
                      }))
                    }
                    onFocus={() =>
                      setEditableFields((current) => ({
                        ...current,
                        email: true,
                      }))
                    }
                    placeholder="admin@mdcat.pk"
                    autoComplete="email"
                    readOnly={!editableFields.email}
                    required
                  />
                  {emailValid ? (
                    <span className="auth-valid-dot" aria-hidden="true" />
                  ) : null}
                </div>

                <div
                  className={`floating-field auth-input-shell auth-password-field ${formData.password ? 'auth-input-shell--filled' : ''} ${passwordValid ? 'auth-input-shell--valid' : ''}`}
                >
                  <span className="auth-input-icon" aria-hidden="true">
                    <LockIcon />
                  </span>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    onMouseDown={() =>
                      setEditableFields((current) => ({
                        ...current,
                        password: true,
                      }))
                    }
                    onTouchStart={() =>
                      setEditableFields((current) => ({
                        ...current,
                        password: true,
                      }))
                    }
                    onFocus={() =>
                      setEditableFields((current) => ({
                        ...current,
                        password: true,
                      }))
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    readOnly={!editableFields.password}
                    required
                  />
                  <button
                    className="auth-inline-toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  {passwordValid ? (
                    <span
                      className="auth-valid-dot auth-valid-dot--password"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                <div className="auth-row">
                  <label className="checkbox auth-checkbox">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                    />
                    <span>Remember this device</span>
                  </label>
                  <Link className="auth-link" to="/forgot-password">
                    Forgot password
                  </Link>
                </div>

                <button
                  className="auth-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Show Google button for student role on all screen sizes */}
                {requestedRole === 'student' && (
                  <div className="auth-google-block">
                    {googleSignIn.configured ? (
                      <>
                        {/* key forces remount if loading state changes */}
                        <div
                          ref={googleSignIn.buttonRef}
                          className="auth-google-rendered"
                          style={{ minHeight: '44px' }}
                        />
                        {!googleSignIn.ready && (
                          <span className="auth-google-loading">
                            Loading Google sign-in…
                          </span>
                        )}
                      </>
                    ) : (
                      <button
                        className="auth-secondary auth-google-pill"
                        type="button"
                        disabled
                      >
                        Google sign-in is not configured
                      </button>
                    )}
                  </div>
                )}

                <p className="auth-footer">
                  New here? <Link to="/register">Create account</Link>
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
