import { Link } from 'react-router-dom'
import './Auth.css'

export default function VerifyEmail() {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="auth-card">
            <h1 className="auth-title">Email Verification</h1>
            <p className="auth-subtitle">
              Email OTP verification is disabled. Please continue with Google to sign in.
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

