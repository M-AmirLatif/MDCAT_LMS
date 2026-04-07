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

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1>🎓 MDCAT LMS</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.firstName}! 👋</h2>
          <p>
            Role: <strong>{user?.role}</strong>
          </p>
        </div>

        <div className="user-info">
          <h3>Your Profile</h3>
          <p>
            <strong>Name:</strong> {user?.firstName} {user?.lastName}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Phone:</strong> {user?.phone || 'Not provided'}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {user?.isActive ? '✅ Active' : '❌ Inactive'}
          </p>
        </div>

        <div className="features">
          <h3>Quick Links:</h3>
          <ul>
            <li>
              <a
                href="/courses"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                }}
              >
                📚 Browse Courses
              </a>
            </li>
          </ul>
        </div>

        <div className="features">
          <h3>Coming Soon Features:</h3>
          <ul>
            <li>📚 Browse Courses</li>
            <li>📝 Take MCQ Tests</li>
            <li>📊 View Performance</li>
            <li>🎥 Watch Lectures</li>
            <li>👨‍🏫 Join Live Classes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
