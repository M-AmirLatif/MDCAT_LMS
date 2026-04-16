import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthToken } from '../services/authStorage'
import './EditProfile.css'

export default function EditProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          navigate('/login')
          return
        }
        const res = await API.get('/auth/profile')
        const u = res.data.user
        setUser(u)
        setForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
        })
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await API.put('/auth/profile', form)
      setUser(res.data.user)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="edit-profile"><p>Loading...</p></div>

  return (
    <div className="edit-profile">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/dashboard')}>Back</button>
      </div>
      <RoleTabs user={user} />

      <div className="edit-profile-container">
        <h2>Edit Profile</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input-disabled"
            />
            <small>Email cannot be changed</small>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 03001234567"
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input type="text" value={user?.role || ''} disabled className="input-disabled" />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
