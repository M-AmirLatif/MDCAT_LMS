import { Link } from 'react-router-dom'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import ThemeToggle from '../components/ThemeToggle'
import './Auth.css'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function Register() {
  const googleSignIn = useGoogleSignIn({ remember: true, mode: 'signup' })

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell--register">
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
            <h1>Create Your Account</h1>
            <p>
              Join Pakistan&apos;s focused MDCAT prep platform. Practice
              chapter based MCQs at home.
            </p>

            <div className="auth-register-steps">
              {[
                ['1', 'Continue with Google', 'Fast signup, instant access, and no email OTP delay.'],
                ['2', 'Set Your Password', 'One-time setup, then log in with Gmail and password.'],
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
              <span>Chapter Based MCQs</span>
              <span>No OTP Email</span>
              <span>Mobile Friendly</span>
              <span>Growing Community</span>
              <span>Live Classes</span>
            </div>
            <p className="auth-bottom-quote">
              Helping MDCAT aspirants achieve their dream of becoming doctors,
              one chapter at a time.
            </p>
          </div>
        </section>

        <section className="auth-form-panel">
          <ThemeToggle className="theme-toggle--auth" />
          <div className="auth-left-inner">
            <div className="auth-card auth-card--platform">
              <h1 className="auth-title">Create your student account</h1>
              <p className="auth-subtitle">
                Sign up with Google to get started. You&apos;ll set a password
                right after to enable email and password login too.
              </p>

              <div className="auth-form">
                <div className="auth-google-block auth-google-block--register">
                  {googleSignIn.configured ? (
                    <>
                      {googleSignIn.loading ? (
                        <span className="auth-google-loading">Loading Google sign-in...</span>
                      ) : null}
                      <div
                        ref={googleSignIn.buttonRef}
                        className="auth-google-rendered-button auth-google-rendered-button--large"
                        aria-label="Sign up with Google"
                      />
                      {googleSignIn.error ? (
                        <span className="auth-google-error-text">{googleSignIn.error}</span>
                      ) : null}
                      {googleSignIn.error ? (
                        <button
                          className="auth-secondary auth-google-retry"
                          type="button"
                          onClick={googleSignIn.retry}
                          disabled={googleSignIn.loading}
                        >
                          Retry Google sign-up
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button className="auth-google-custom-btn auth-google-custom-btn--disabled" type="button" disabled>
                      <GoogleIcon />
                      <span>Continue with Google is not configured</span>
                    </button>
                  )}
                </div>

                <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
                  Already have an account? <Link to="/login">Log in</Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
