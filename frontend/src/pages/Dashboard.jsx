import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
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

  if (loading)
    return (
      <div className="page-content">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )

  const isTeacher =
    user?.role === 'teacher' ||
    user?.role === 'admin' ||
    user?.role === 'superadmin'
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  const subjectColor = (cat) => {
    const map = {
      Biology: 'var(--bio-color)',
      Chemistry: 'var(--chem-color)',
      Physics: 'var(--phys-color)',
      English: 'var(--eng-color)',
    }
    return map[cat] || 'var(--brand)'
  }

  const subjectBg = (cat) => {
    const map = {
      Biology: 'var(--bio-bg)',
      Chemistry: 'var(--chem-bg)',
      Physics: 'var(--phys-bg)',
      English: 'var(--eng-bg)',
    }
    return map[cat] || 'var(--brand-subtle)'
  }

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="dash-welcome animate-fade-up">
        <div className="dash-welcome-text">
          <p className="dash-eyebrow">Welcome back</p>
          <h2>
            {user?.firstName} {user?.lastName} 👋
          </h2>
          <p className="dash-welcome-sub">
            Ready to continue your MDCAT preparation? Let's keep the momentum going.
          </p>
        </div>
        <div className="dash-welcome-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/courses')}>
            Browse Courses
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/performance')}>
            View Progress
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dash-stats stagger">
        <div className="dash-stat-card" onClick={() => navigate('/courses')}>
          <div className="dash-stat-icon" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-light)' }}>
            📚
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{enrolledCourses.length}</span>
            <span className="dash-stat-label">Enrolled Courses</span>
          </div>
        </div>

        <div className="dash-stat-card" onClick={() => navigate('/performance')}>
          <div className="dash-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-light)' }}>
            🎯
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{testSummary?.totalTests || 0}</span>
            <span className="dash-stat-label">Tests Taken</span>
          </div>
        </div>

        <div className="dash-stat-card" onClick={() => navigate('/performance')}>
          <div className="dash-stat-icon" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
            📈
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{testSummary?.avgPercentage || 0}%</span>
            <span className="dash-stat-label">Average Score</span>
          </div>
        </div>

        <div className="dash-stat-card" onClick={() => navigate('/notifications')}>
          <div className="dash-stat-icon" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
            🔔
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{unreadCount}</span>
            <span className="dash-stat-label">Unread Alerts</span>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      {enrolledCourses.length > 0 && (
        <div className="dash-section animate-fade-up">
          <div className="dash-section-header">
            <h3>Your Courses</h3>
            {enrolledCourses.length > 4 && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/courses')}>
                View all {enrolledCourses.length}
              </button>
            )}
          </div>
          <div className="dash-courses-grid stagger">
            {enrolledCourses.slice(0, 4).map((course) => (
              <div
                key={course._id}
                className="dash-course-card card card-interactive"
                onClick={() => navigate(`/course/${course._id}`)}
              >
                <div
                  className="dash-course-accent"
                  style={{ background: subjectColor(course.category) }}
                />
                <span
                  className="badge"
                  style={{
                    background: subjectBg(course.category),
                    color: subjectColor(course.category),
                  }}
                >
                  {course.category}
                </span>
                <h4>{course.name}</h4>
                <p className="dash-course-teacher">
                  {course.createdBy?.firstName} {course.createdBy?.lastName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Info */}
      <div className="dash-section animate-fade-up">
        <div className="dash-section-header">
          <h3>Your Profile</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/profile/edit')}
          >
            Edit Profile
          </button>
        </div>
        <div className="dash-profile card">
          <div className="dash-profile-grid">
            <div className="dash-profile-item">
              <span className="dash-profile-label">Name</span>
              <p>
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="dash-profile-item">
              <span className="dash-profile-label">Email</span>
              <p>{user?.email}</p>
            </div>
            <div className="dash-profile-item">
              <span className="dash-profile-label">Phone</span>
              <p>{user?.phone || 'Not provided'}</p>
            </div>
            <div className="dash-profile-item">
              <span className="dash-profile-label">Status</span>
              <p className="flex items-center gap-sm">
                <span className={`status-dot ${user?.isActive ? 'active' : 'inactive'}`} />
                {user?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="dash-section animate-fade-up">
        <h3>Quick Links</h3>
        <div className="dash-links stagger">
          <button className="dash-link-card card card-interactive" onClick={() => navigate('/courses')}>
            <span>📚</span> Browse Courses
          </button>
          <button className="dash-link-card card card-interactive" onClick={() => navigate('/performance')}>
            <span>📈</span> View Performance
          </button>
          <button className="dash-link-card card card-interactive" onClick={() => navigate('/notifications')}>
            <span>🔔</span> Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
          <button className="dash-link-card card card-interactive" onClick={() => navigate('/live-sessions')}>
            <span>🎥</span> Live Classes
          </button>
          <button className="dash-link-card card card-interactive" onClick={() => navigate('/payments')}>
            <span>💳</span> Payments
          </button>
          {isTeacher && (
            <button className="dash-link-card card card-interactive" onClick={() => navigate('/teacher/courses')}>
              <span>📝</span> Manage Courses
            </button>
          )}
          {isAdmin && (
            <button className="dash-link-card card card-interactive" onClick={() => navigate('/admin')}>
              <span>⚙️</span> Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
