import { useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuth()
  const googleBtnRef = useRef(null)
  const googleInitRef = useRef(false)

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
            storeLogin(res.data.token, res.data.user, true)
            if (res.data?.user?.needsPasswordSetup) {
              navigate('/set-password')
            } else {
              navigate('/dashboard')
            }
          } catch (e) {
            const msg = e.response?.data?.error || 'Google sign-up failed'
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
        text: 'signup_with',
      })
    }

    script.addEventListener('load', onReady)
    if (window.google?.accounts?.id) onReady()

    return () => script.removeEventListener('load', onReady)
  }, [navigate, storeLogin])

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
              <h1 className="auth-title">Create your student account</h1>
              <p className="auth-subtitle">
                Continue with Google to create your account, then set a password for future Gmail + password logins.
              </p>

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

              <div className="auth-helper">
                <div className="auth-helper-title">How it works</div>
                <div className="auth-steps">
                  <div className="auth-step">
                    <div className="auth-step-num">1</div>
                    <div className="auth-step-body">
                      <div className="auth-step-title">Continue with Google</div>
                      <div className="auth-step-text">Fast signup with your Gmail — no OTP email.</div>
                    </div>
                  </div>
                  <div className="auth-step">
                    <div className="auth-step-num">2</div>
                    <div className="auth-step-body">
                      <div className="auth-step-title">Set your password</div>
                      <div className="auth-step-text">One time only, then you can login with Gmail + password.</div>
                    </div>
                  </div>
                  <div className="auth-step">
                    <div className="auth-step-num">3</div>
                    <div className="auth-step-body">
                      <div className="auth-step-title">Start practicing</div>
                      <div className="auth-step-text">Courses, MCQs, tests, and performance tracking.</div>
                    </div>
                  </div>
                </div>

                <div className="auth-benefits" aria-label="Highlights">
                  <div className="auth-benefit">Free sample test available without login</div>
                  <div className="auth-benefit">Explanations and review</div>
                  <div className="auth-benefit">Mobile-friendly learning</div>
                </div>
              </div>

              <p className="auth-footer">
                Want to try first? <Link to="/sample-test">Attempt free sample test</Link>
              </p>

              <p className="auth-footer">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          </div>
        </div>

        <aside className="auth-right" aria-hidden="true">
          <div className="auth-right-inner">
            <div className="mock-canvas">
              <div className="mock-card mock-card--left">
                <div className="mock-card-title">Sample Test</div>
                <div className="mock-pill">No login required</div>
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
                <div className="mock-card-title">Join & Improve</div>
                <div className="mock-pill">Practice daily</div>
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
              <h2>Google-first onboarding</h2>
              <p>
                This avoids OTP emails and still lets you use Gmail + password later.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
