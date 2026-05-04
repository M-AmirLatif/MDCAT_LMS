import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import ThemeToggle from '../components/ThemeToggle'
import './Auth.css'

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

export default function Register() {
  const googleSignIn = useGoogleSignIn({ remember: true, mode: 'signup' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [editableFields, setEditableFields] = useState({ email: false, password: false, confirmPassword: false })
  const emailValid = /\S+@\S+\.\S+/.test(email)
  const passwordValid = password.trim().length > 0
  const confirmPasswordValid = confirmPassword.trim().length > 0 && confirmPassword === password

  const handleCreateAccount = (event) => {
    event.preventDefault()
    if (!email || !password || !confirmPassword) {
      toast.error('Complete the form or continue with Google.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    if (!termsAccepted) {
      toast.error('Accept the terms to continue.')
      return
    }
    toast('Google-first onboarding is enabled. Use Continue with Google to finish account creation.')
  }

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell--register">
        <section className="auth-brand-panel">
          <div className="auth-dark-grid" />
          <div className="auth-brand auth-brand--dark">
            <span className="auth-mark">M</span>
            <span className="auth-brand-name">MDCAT LMS</span>
          </div>
          <div className="auth-mobile-stat"><i />400k+ Students</div>
          <div className="auth-brand-content">
            <div className="label-xs auth-kicker">New to MDCAT LMS?</div>
            <h1>Create Your Account</h1>
            <p>Join Pakistan&apos;s largest MDCAT prep platform. 400k+ students trust us.</p>

            <div className="auth-register-steps">
              {[
                ['1', 'Continue with Google', 'Fast signup, no OTP email, instant access.'],
                ['2', 'Set Your Password', 'One time setup, then login with Gmail + password.'],
                ['3', 'Start Practicing', 'MCQs, live classes, tests, and performance tracking.'],
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
              <span>Free Sample Test</span>
              <span>No OTP Email</span>
              <span>Mobile Friendly</span>
              <span>400k+ Students</span>
              <span>Live Classes</span>
            </div>
            <p className="auth-bottom-quote">Already helping 400k+ MDCAT aspirants achieve their dream of becoming doctors.</p>
          </div>
        </section>

        <section className="auth-form-panel">
          <ThemeToggle className="theme-toggle--auth" />
          <div className="auth-left-inner">
            <div className="auth-card auth-card--platform">
              <h1 className="auth-title">Create your student account</h1>
              <p className="auth-subtitle">Join with Google-first onboarding or fill details below.</p>

              <form className="auth-form" onSubmit={handleCreateAccount} autoComplete="off">
                <div className="auth-google-block auth-google-block--register">
                  {googleSignIn.configured ? (
                    <>
                      <div ref={googleSignIn.buttonRef} className="auth-google-rendered" />
                      {!googleSignIn.ready ? <span className="auth-google-loading">Loading Google sign-up...</span> : null}
                    </>
                  ) : (
                    <button className="auth-secondary auth-google-cta" type="button" disabled>
                      Continue with Google is not configured
                    </button>
                  )}
                </div>

                <div className="auth-divider"><span>or</span></div>

                <div className={`floating-field auth-input-shell ${email ? 'auth-input-shell--filled' : ''} ${emailValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><MailIcon /></span>
                  <label htmlFor="register-email">Email</label>
                  <input
                    id="register-email"
                    name="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onFocus={() => setEditableFields((current) => ({ ...current, email: true }))}
                    placeholder="student@mdcat.pk"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    readOnly={!editableFields.email}
                  />
                </div>

                <div className={`floating-field auth-input-shell auth-password-field ${password ? 'auth-input-shell--filled' : ''} ${passwordValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
                  <label htmlFor="register-password">Password</label>
                  <input
                    id="register-password"
                    name="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setEditableFields((current) => ({ ...current, password: true }))}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    readOnly={!editableFields.password}
                  />
                  <button className="auth-inline-toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className={`floating-field auth-input-shell auth-password-field ${confirmPassword ? 'auth-input-shell--filled' : ''} ${confirmPasswordValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
                  <label htmlFor="register-confirm-password">Confirm Password</label>
                  <input
                    id="register-confirm-password"
                    name="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onFocus={() => setEditableFields((current) => ({ ...current, confirmPassword: true }))}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    readOnly={!editableFields.confirmPassword}
                  />
                  <button className="auth-inline-toggle" type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <label className="checkbox auth-terms auth-checkbox">
                  <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                  <span>I agree to the <Link to="/register">terms</Link> and <Link to="/register">privacy policy</Link>.</span>
                </label>

                <button className="auth-primary" type="submit">Create Account</button>
                <p className="auth-footer">Already have an account? <Link to="/login">Log in</Link></p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
