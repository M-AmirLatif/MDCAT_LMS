import { Link } from 'react-router-dom'
import './Auth.css'

export default function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="auth-card">
            <h1 className="auth-title">Password Reset</h1>
            <p className="auth-subtitle">
              Email OTP reset is disabled. Please sign in with Google and set a new password from your profile.
            </p>
            <p className="auth-footer">
              <Link to="/login">Back to login</Link>
            </p>
          </div>
        </div>
        <aside className="auth-right" aria-hidden="true" />
      </div>
    </div>
  )
}

