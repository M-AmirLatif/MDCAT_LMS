import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const res = await API.get('/auth/profile')
        setUser(res.data.user)
      } catch (err) {
        console.error('Error fetching profile:', err)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading)
    return (
      <div className="dashboard">
        <p>Loading...</p>
      </div>
    )

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <p className="label">Dashboard</p>
          <h2>Welcome, {user?.firstName}</h2>
          <p className="role">Role: {user?.role}</p>
        </div>

        <div className="user-info">
          <h3>Your Profile</h3>
          <div className="info-grid">
            <div>
              <span>Name</span>
              <p>
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <span>Email</span>
              <p>{user?.email}</p>
            </div>
            <div>
              <span>Phone</span>
              <p>{user?.phone || 'Not provided'}</p>
            </div>
            <div>
              <span>Status</span>
              <p>{user?.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>

        <div className="features">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="/courses">Browse Courses</a>
            </li>
            <li>
              <a href="/performance">View Performance</a>
            </li>
            <li>
              <a href="/notifications">Notifications</a>
            </li>
            <li>
              <a href="/live-sessions">Live Classes</a>
            </li>
            <li>
              <a href="/payments">Payments</a>
            </li>
            {isTeacher && (
              <li>
                <a href="/teacher/courses">Manage Courses</a>
              </li>
            )}
            {isAdmin && (
              <li>
                <a href="/admin">Admin Panel</a>
              </li>
            )}
          </ul>
        </div>

        <div className="features muted">
          <h3>Coming Soon</h3>
          <ul>
            <li>Topic-based study plans</li>
            <li>Peer discussions</li>
            <li>Certificates</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
