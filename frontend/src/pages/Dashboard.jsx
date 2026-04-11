import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import './Dashboard.css'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [testSummary, setTestSummary] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const [profileRes, enrolledRes, summaryRes, notifRes] =
          await Promise.all([
            API.get('/auth/profile'),
            API.get('/courses/student/enrolled-courses').catch(() => ({
              data: { courses: [] },
            })),
            API.get('/tests/summary').catch(() => ({ data: {} })),
            API.get('/notifications').catch(() => ({
              data: { notifications: [] },
            })),
          ])

        setUser(profileRes.data.user)
        setEnrolledCourses(enrolledRes.data.courses || [])
        setTestSummary(summaryRes.data)

        const unread = (notifRes.data.notifications || []).filter(
          (n) => !n.isRead,
        ).length
        setUnreadCount(unread)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  const isTeacher =
    user?.role === 'teacher' ||
    user?.role === 'admin' ||
    user?.role === 'superadmin'
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <RoleTabs user={user} />

      <div className="dashboard-content">
        <div className="welcome-card">
          <p className="label">Dashboard</p>
          <h2>Welcome, {user?.firstName} 👋</h2>
          <p className="role">Role: {user?.role}</p>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="quick-stat" onClick={() => navigate('/courses')}>
            <span className="stat-icon">📚</span>
            <span className="stat-value">{enrolledCourses.length}</span>
            <span className="stat-label">Enrolled Courses</span>
          </div>
          <div className="quick-stat" onClick={() => navigate('/performance')}>
            <span className="stat-icon">🎯</span>
            <span className="stat-value">{testSummary?.totalTests || 0}</span>
            <span className="stat-label">Tests Taken</span>
          </div>
          <div className="quick-stat" onClick={() => navigate('/performance')}>
            <span className="stat-icon">📈</span>
            <span className="stat-value">{testSummary?.avgPercentage || 0}%</span>
            <span className="stat-label">Avg Score</span>
          </div>
          <div className="quick-stat" onClick={() => navigate('/notifications')}>
            <span className="stat-icon">🔔</span>
            <span className="stat-value">{unreadCount}</span>
            <span className="stat-label">Unread Alerts</span>
          </div>
        </div>

        {/* Enrolled Courses */}
        {enrolledCourses.length > 0 && (
          <div className="enrolled-section">
            <h3>Your Courses</h3>
            <div className="enrolled-grid">
              {enrolledCourses.slice(0, 4).map((course) => (
                <div
                  key={course._id}
                  className="enrolled-card"
                  onClick={() => navigate(`/course/${course._id}`)}
                >
                  <span className="enrolled-cat">{course.category}</span>
                  <h4>{course.name}</h4>
                  <p className="enrolled-teacher">
                    {course.createdBy?.firstName} {course.createdBy?.lastName}
                  </p>
                </div>
              ))}
            </div>
            {enrolledCourses.length > 4 && (
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/courses')}
                style={{ marginTop: '12px' }}
              >
                View all {enrolledCourses.length} courses
              </button>
            )}
          </div>
        )}

        {/* Profile Info */}
        <div className="user-info">
          <div className="user-info-header">
            <h3>Your Profile</h3>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/profile/edit')}
            >
              Edit Profile
            </button>
          </div>
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
              <a href="/notifications">
                Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </a>
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
      </div>
    </div>
  )
}
