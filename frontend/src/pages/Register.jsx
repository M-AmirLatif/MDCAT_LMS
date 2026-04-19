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
        width: 420,
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
          <div className="auth-card">
            <h1 className="auth-title">Create your student account</h1>
            <p className="auth-subtitle">
              Sign up with Google, then set a password for future Gmail + password logins.
            </p>

            <div className="google-wrap">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
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

            <p className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>

        <aside className="auth-right" aria-hidden="true">
          <div className="auth-right-inner">
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

