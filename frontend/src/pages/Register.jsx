import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import ThemeToggle from '../components/ThemeToggle'
import { Link } from 'react-router-dom'
import './Auth.css'

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
            <div className="label-xs auth-kicker">New to MDCAT LMS?</div>
            <h1>Create Your Account</h1>
            <p>
              Join Pakistan&apos;s focused MDCAT prep platform. Practice
              chapter-wise MCQs at home.
            </p>

            <div className="auth-register-steps">
              {[
                [
                  '1',
                  'Continue with Google',
                  'Fast signup — no OTP email, instant access.',
                ],
                [
                  '2',
                  'Set Your Password',
                  'One-time setup, then log in with Gmail + password.',
                ],
                [
                  '3',
                  'Start Practicing',
                  'MCQs, live classes, tests, and performance tracking.',
                ],
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
              <span>Chapter-wise MCQs</span>
              <span>No OTP Email</span>
              <span>Mobile Friendly</span>
              <span>Growing Community</span>
              <span>Live Classes</span>
            </div>
            <p className="auth-bottom-quote">
              Helping MDCAT aspirants achieve their dream of becoming doctors —
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
                right after to enable email + password login too.
              </p>

              <div className="auth-form">
                <div className="auth-google-block auth-google-block--register">
                  {googleSignIn.configured ? (
                    <>
                      <div
                        ref={googleSignIn.buttonRef}
                        className="auth-google-rendered"
                        style={{ minHeight: '44px' }}
                      />
                      {!googleSignIn.ready && (
                        <span className="auth-google-loading">
                          Loading Google sign-up…
                        </span>
                      )}
                    </>
                  ) : (
                    <button
                      className="auth-secondary auth-google-cta"
                      type="button"
                      disabled
                    >
                      Continue with Google is not configured
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
