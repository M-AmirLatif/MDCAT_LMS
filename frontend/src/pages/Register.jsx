import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
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
  const navigate = useNavigate()
  const googleSignIn = useGoogleSignIn({ remember: true, mode: 'signup' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
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
        <section className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-brand" aria-label="MDCAT LMS">
              <span className="auth-mark" aria-hidden="true">M</span>
              <span className="auth-brand-name">MDCAT LMS</span>
            </div>

            <div className="auth-card auth-card--platform">
              <h1 className="auth-title">Create your student account</h1>
              <p className="auth-subtitle">Join the platform with Google-first onboarding or prepare your student login details below.</p>

              <form className="auth-form" onSubmit={handleCreateAccount}>
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

                <div className="auth-fields-panel">
                <div className={`floating-field auth-input-shell ${email ? 'auth-input-shell--filled' : ''} ${emailValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><MailIcon /></span>
                  <label htmlFor="register-email">Email</label>
                  <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@mdcat.pk" />
                  {emailValid ? <span className="auth-valid-dot" aria-hidden="true" /> : null}
                </div>

                <div className={`floating-field auth-input-shell auth-password-field ${password ? 'auth-input-shell--filled' : ''} ${passwordValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
                  <label htmlFor="register-password">Password</label>
                  <input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" />
                  <button className="auth-inline-toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  {passwordValid ? <span className="auth-valid-dot auth-valid-dot--password" aria-hidden="true" /> : null}
                </div>

                <div className={`floating-field auth-input-shell auth-password-field ${confirmPassword ? 'auth-input-shell--filled' : ''} ${confirmPasswordValid ? 'auth-input-shell--valid' : ''}`}>
                  <span className="auth-input-icon" aria-hidden="true"><LockIcon /></span>
                  <label htmlFor="register-confirm-password">Confirm Password</label>
                  <input id="register-confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your password" />
                  <button className="auth-inline-toggle" type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                  {confirmPasswordValid ? <span className="auth-valid-dot auth-valid-dot--password" aria-hidden="true" /> : null}
                </div>
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

        <aside className="auth-right" aria-hidden="true">
          <div className="auth-preview auth-preview--register">
            <div className="auth-register-bg-dots" />
            <div className="auth-preview-card auth-preview-card--register">
              <h2>Google-first onboarding</h2>
              <p>Fast onboarding for MDCAT students with fewer steps, no OTP email friction, and immediate access to practice.</p>

              <div className="auth-register-steps">
                <div className="auth-register-step">
                  <span className="auth-register-step-number">1</span>
                  <div>
                    <strong>Continue with Google</strong>
                    <p>Start with one tap using your Gmail account.</p>
                  </div>
                </div>
                <div className="auth-register-step">
                  <span className="auth-register-step-number">2</span>
                  <div>
                    <strong>Set Password</strong>
                    <p>Create your fallback password for future logins.</p>
                  </div>
                </div>
                <div className="auth-register-step">
                  <span className="auth-register-step-number">3</span>
                  <div>
                    <strong>Start Practicing</strong>
                    <p>Open your courses, analytics, and free sample tests instantly.</p>
                  </div>
                </div>
              </div>

              <div className="auth-feature-list">
                <div className="auth-feature-item">Free sample test</div>
                <div className="auth-feature-item">No OTP email</div>
                <div className="auth-feature-item">Mobile-friendly</div>
              </div>

              <div className="auth-register-stat">
                <strong>28k+ active MDCAT learners</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
