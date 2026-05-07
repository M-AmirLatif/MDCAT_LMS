import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M7 10V8a5 5 0 1 1 10 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  )
}

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [editableFields, setEditableFields] = useState({ password: false, confirm: false })
  const navigate = useNavigate()
  const { user, login: storeLogin } = useAuth()

  const passwordValid = password.length >= 6
  const confirmValid = confirm.length >= 6 && confirm === password

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!passwordValid) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await API.post('/auth/set-password', { password })
      // Update stored token + user — needsPasswordSetup will be false on the new user object
      storeLogin(res.data.token, res.data.user, true)
      toast.success('Password set! You can now log in with email and password.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell--set-password">
        <section className="auth-brand-panel">
          <div className="auth-dark-grid" />
          <div className="auth-brand auth-brand--dark">
            <span className="auth-mark">M</span>
            <span className="auth-brand-name">MDCAT LMS</span>
          </div>
          <div className="auth-mobile-stat"><i />Secure setup</div>
          <div className="auth-brand-content">
            <div className="label-xs auth-kicker">Google onboarding</div>
            <h1>One-Time Password Setup</h1>
            <p>Set a password once, then sign in anytime with your Gmail and password on every device.</p>

            <div className="auth-register-steps">
              {[
                ['1', 'Google account verified', user?.email || 'Your Gmail is connected.'],
                ['2', 'Create secure password', 'Use at least 6 characters for your MDCAT LMS login.'],
                ['3', 'Start practicing', 'After saving, you will go directly to your student dashboard.'],
              ].map(([number, title, body]) => (
                <div className="auth-register-step" key={title}>
                  <span className="auth-register-step-number">{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="auth-feature-list">
              <span>Secure Login</span>
              <span>Gmail Linked</span>
              <span>One-Time Setup</span>
              <span>Mobile Friendly</span>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <ThemeToggle className="theme-toggle--auth" />
          <div className="auth-left-inner">
            <div className="auth-card auth-card--platform">
              <span className="role-pill">Student Setup</span>
              <h1 className="auth-title">Set your password</h1>
              <p className="auth-subtitle">
                {user?.email
                  ? `Create a password for ${user.email}.`
                  : 'Create a password for your account.'}
              </p>

              <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
                <div className={`floating-field auth-input-shell auth-password-field ${password ? 'auth-input-shell--filled' : ''} ${passwordValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
                  <label htmlFor="set-password">New Password</label>
                  <input
                    id="set-password"
                    name="set-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setEditableFields((current) => ({ ...current, password: true }))}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    readOnly={!editableFields.password}
                  />
                  <button className="auth-inline-toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className={`floating-field auth-input-shell auth-password-field ${confirm ? 'auth-input-shell--filled' : ''} ${confirmValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
                  <label htmlFor="set-password-confirm">Confirm Password</label>
                  <input
                    id="set-password-confirm"
                    name="set-password-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    onFocus={() => setEditableFields((current) => ({ ...current, confirm: true }))}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    readOnly={!editableFields.confirm}
                  />
                  <button className="auth-inline-toggle" type="button" onClick={() => setShowConfirm((current) => !current)}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>

                <button className="auth-primary" type="submit" disabled={loading || !passwordValid || !confirmValid}>
                  {loading ? 'Saving…' : 'Save Password'}
                </button>

                <p className="auth-footer">
                  Already completed setup?{' '}
                  <button type="button" onClick={() => navigate('/dashboard', { replace: true })}>
                    Go to dashboard
                  </button>
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
