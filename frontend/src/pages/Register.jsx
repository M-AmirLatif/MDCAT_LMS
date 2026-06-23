import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGoogleSignIn } from '../hooks/useGoogleSignIn'
import { useAuth } from '../context/AuthContext'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import ThemeToggle from '../components/ThemeToggle'
import './Auth.css'

const roles = [
  { key: 'student', label: 'Student', hint: 'Practice MCQs' },
  { key: 'teacher', label: 'Teacher', hint: 'Manage one subject' },
]

const subjects = ['Biology', 'Chemistry', 'Physics', 'English']

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
  const navigate = useNavigate()
  const { login } = useAuth()
  const googleSignIn = useGoogleSignIn({ remember: true, mode: 'signup' })
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    assignedSubject: 'Biology',
  })
  const [submitting, setSubmitting] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setPendingMessage('')
    setSubmitting(true)
    try {
      const res = await API.post('/auth/register', {
        ...form,
        role,
        subjectId: role === 'teacher' ? form.assignedSubject : undefined,
      })

      if (role === 'teacher') {
        setPendingMessage(res.data.message || 'Your teacher account is pending admin approval.')
        toast.success('Teacher request submitted.')
        return
      }

      if (res.data.token && res.data.user) {
        login(res.data.token, res.data.user, true)
        navigate('/dashboard', { replace: true })
      } else {
        toast.success('Account created. Please log in.')
        navigate('/login', { replace: true })
      }
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Registration failed.'))
    } finally {
      setSubmitting(false)
    }
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
          <div className="auth-mobile-stat"><i />MDCAT Prep</div>
          <div className="auth-brand-content">
            <h1>Create Your Account</h1>
            <p>Register as a student immediately, or request teacher access for a specific MDCAT subject.</p>
            <div className="auth-register-steps">
              {[
                ['1', 'Choose Role', 'Student access is instant. Teacher access requires admin approval.'],
                ['2', 'Enter Details', 'Teachers choose one assigned subject during registration.'],
                ['3', 'Start Securely', 'Approved teachers can manage only their assigned subject.'],
              ].map(([number, title, body]) => (
                <div className="auth-register-step" key={title}>
                  <span className="auth-register-step-number">{number}</span>
                  <div><strong>{title}</strong><p>{body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <ThemeToggle className="theme-toggle--auth" />
          <div className="auth-left-inner">
            <div className="auth-card auth-card--platform">
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-subtitle">Select your role and complete registration.</p>

              <label className="auth-field">
                <span>Register as</span>
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                  {roles.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </label>

              <div className="auth-role-switcher auth-role-switcher--mobile" aria-label="Choose registration role">
                {roles.map((item) => (
                  <button key={item.key} className={`auth-role-option ${role === item.key ? 'auth-role-option--active' : ''}`} type="button" onClick={() => setRole(item.key)}>
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </button>
                ))}
              </div>

              {pendingMessage ? (
                <div className="auth-form">
                  <div className="auth-success-message">{pendingMessage}</div>
                  <Link className="auth-submit" to="/login">Go to login</Link>
                </div>
              ) : (
                <form className="auth-form" onSubmit={submit} autoComplete="off">
                  <div className="auth-grid-two">
                    <label className="auth-field">
                      <span>First name</span>
                      <input value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} placeholder="Enter your first name" autoComplete="given-name" required />
                    </label>
                    <label className="auth-field">
                      <span>Last name</span>
                      <input value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} placeholder="Enter your last name" autoComplete="family-name" />
                    </label>
                  </div>
                  <label className="auth-field">
                    <span>Email</span>
                    <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="Enter your email" autoComplete="off" required />
                  </label>
                  <label className="auth-field">
                    <span>Password</span>
                    <input type="password" value={form.password} onChange={(event) => setField('password', event.target.value)} placeholder="Enter your password" autoComplete="new-password" minLength={6} required />
                  </label>
                  {role === 'teacher' ? (
                    <label className="auth-field">
                      <span>Assigned subject</span>
                      <select value={form.assignedSubject} onChange={(event) => setField('assignedSubject', event.target.value)}>
                        {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                      </select>
                    </label>
                  ) : null}
                  <button className="auth-submit" type="submit" disabled={submitting}>
                    {submitting ? 'Creating...' : role === 'teacher' ? 'Request teacher access' : 'Create student account'}
                  </button>
                </form>
              )}

              {role === 'student' && !pendingMessage ? (
                <div className="auth-google-block auth-google-block--register">
                  {googleSignIn.configured ? (
                    <>
                      <div ref={googleSignIn.buttonRef} className="auth-google-rendered-button auth-google-rendered-button--large" aria-label="Sign up with Google" />
                      {googleSignIn.error ? <span className="auth-google-error-text">{googleSignIn.error}</span> : null}
                    </>
                  ) : (
                    <button className="auth-google-custom-btn auth-google-custom-btn--disabled" type="button" disabled>
                      <GoogleIcon />
                      <span>Continue with Google is not configured</span>
                    </button>
                  )}
                </div>
              ) : null}

              <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
