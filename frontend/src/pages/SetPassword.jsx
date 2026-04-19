import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, login: storeLogin } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
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
      // Backend returns a fresh token + user
      storeLogin(res.data.token, res.data.user, true)
      toast.success('Password set. You can now login with email + password.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-left">
          <div className="auth-card">
            <h1 className="auth-title">Set Password</h1>
            <p className="auth-subtitle">
              {user?.email
                ? `Create a password for ${user.email}.`
                : 'Create a password for your account.'}
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>

              <div className="field">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>

              <button className="auth-primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save password'}
              </button>
            </form>
          </div>
        </div>

        <aside className="auth-right" aria-hidden="true">
          <div className="auth-right-inner">
            <div className="auth-right-copy">
              <h2>One-time setup</h2>
              <p>
                After setting a password, you can sign in anytime using your Gmail and password.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

