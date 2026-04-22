import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  clearRememberedCredentials,
  setRememberedCredentials,
} from '../services/authStorage'
import './Auth.css'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [autofillGuard, setAutofillGuard] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { login: storeLogin } = useAuth()
  const requestedRole = searchParams.get('role')
  const nextPath = searchParams.get('next')
  const allowGoogle = !requestedRole || requestedRole === 'student'

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
    setRemember(!!localStorage.getItem('remember_email'))
  }, [])

  useEffect(() => {
    // Some browsers autofill even on controlled inputs; force-clear after mount.
    const timer = setTimeout(() => {
      setFormData({ email: '', password: '' })
      if (emailRef.current) emailRef.current.value = ''
      if (passwordRef.current) passwordRef.current.value = ''
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
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
            } else {
              clearRememberedCredentials()
            }
            if (res.data?.user?.needsPasswordSetup) {
              navigate('/set-password')
            } else {
              navigate(nextPath || '/dashboard')
            }
          } catch (e) {
            const msg = e.response?.data?.error || 'Google login failed'
            if (String(msg).toLowerCase().includes('not configured')) {
              toast.error(
                'Google login not configured on server (set GOOGLE_CLIENT_ID in backend env).',
              )
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
        text: 'signin_with',
      })
    }

    script.addEventListener('load', onReady)
    if (window.google?.accounts?.id) onReady()

    return () => script.removeEventListener('load', onReady)
  }, [navigate, nextPath, remember, storeLogin])

  const unlockAutofill = (e) => {
    if (!autofillGuard) return
    setAutofillGuard(false)
    if (e?.currentTarget) e.currentTarget.readOnly = false
  }

  const handleChange = (e) => {
    const key = e.target.name === 'username' ? 'email' : e.target.name
    setFormData({ ...formData, [key]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const email = emailRef.current?.value || formData.email
      const password = passwordRef.current?.value || formData.password
      const res = await API.post('/auth/login', { email, password })
      storeLogin(res.data.token, res.data.user, remember)
      if (remember) {
        setRememberedCredentials({ email, remember })
      } else {
        clearRememberedCredentials()
      }
      navigate(nextPath || '/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed'
      setError(msg)
      if (String(msg).toLowerCase().includes('password not set')) {
        toast.error('Use Google login once to set your password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-brand" aria-label="MDCAT LMS">
              <span className="auth-mark" aria-hidden="true" />
              <span className="auth-brand-name">MDCAT LMS</span>
            </div>

            <div className="auth-card">
              {requestedRole && (
                <div className="auth-meta">{roleLabels[requestedRole] || 'Login'}</div>
              )}

              <h1 className="auth-title">Login</h1>
              <p className="auth-subtitle">Welcome back! Please enter your details.</p>

              {error && <div className="auth-alert auth-alert--error">{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    readOnly={autofillGuard}
                    onFocus={unlockAutofill}
                    ref={emailRef}
                  />
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <div className="input-with-button">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      required
                      readOnly={autofillGuard}
                      onFocus={unlockAutofill}
                      ref={passwordRef}
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

                {allowGoogle && (
                  <div className="google-wrap">
                    {(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim() ? (
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
                        Continue with Google
                      </button>
                    )}
                  </div>
                )}

                <p className="auth-footer">
                  Don&apos;t have an account? <Link to="/register">Sign up</Link>
                </p>
              </form>

              <p className="auth-footer">
                Just exploring? <Link to="/sample-test">Try free sample test</Link>
              </p>
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
                  <div className="mock-avatar accent" />
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
                  <div className="mock-avatar" />
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
    </div>
  )
}

