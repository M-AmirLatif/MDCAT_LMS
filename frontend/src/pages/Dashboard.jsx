import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import API from '../services/api'
import { getAuthToken } from '../services/authStorage'
import './Dashboard.css'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [testSummary, setTestSummary] = useState(null)
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          navigate('/login')
          return
        }

        const [profileRes, enrolledRes, summaryRes, notifRes] = await Promise.all([
          API.get('/auth/profile'),
          API.get('/courses/student/enrolled-courses').catch(() => ({ data: { courses: [] } })),
          API.get('/tests/summary').catch(() => ({ data: {} })),
          API.get('/notifications').catch(() => ({ data: { notifications: [] } })),
        ])

        setUser(profileRes.data.user)
        setEnrolledCourses(enrolledRes.data.courses || [])
        setTestSummary(summaryRes.data)
        setNotifications((notifRes.data.notifications || []).slice(0, 4))
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const chartData = [
    { name: 'Jan', tests: 40, score: 60 },
    { name: 'Feb', tests: 30, score: 70 },
    { name: 'Mar', tests: 60, score: 75 },
    { name: 'Apr', tests: 80, score: 85 },
    { name: 'May', tests: 45, score: 90 },
    { name: 'Jun', tests: 70, score: 92 },
  ]

  const subjectColor = (cat) => {
    const map = {
      Biology: '#3b82f6',
      Chemistry: '#f59e0b',
      Physics: '#8b5cf6',
      English: '#10b981',
    }
    return map[cat] || 'var(--brand)'
  }

  const subjectBg = (cat) => {
    const map = {
      Biology: '#eff6ff',
      Chemistry: '#fef3c7',
      Physics: '#f3e8ff',
      English: '#d1fae5',
    }
    return map[cat] || '#f3f4f6'
  }

  const isTeacher = ['teacher', 'admin', 'superadmin'].includes(user?.role)
  const shownCourses = enrolledCourses.slice(0, 3)

  return (
    <div className="dash-container animate-fade-up">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Overview</h2>
          <p className="dash-subtitle">Welcome back, {user?.firstName}. Keep your progress steady.</p>
        </div>
        {!user?.isActive && (
          <div className="badge badge-warning" style={{ alignSelf: 'center', padding: '8px 16px', fontSize: '13px' }}>
            Account Pending Activation
          </div>
        )}
      </div>

      <div className="dash-grid">
        <div className="dash-area dash-area--courses">
          <div className={`dash-cards-row dash-cards-row--count-${Math.min(shownCourses.length || 1, 3)}`}>
            {shownCourses.map((course) => (
              <div
                key={course._id}
                className="course-block card-interactive"
                style={{ background: subjectBg(course.category) }}
                onClick={() => navigate(`/course/${course._id}`)}
              >
                <div className="course-block-badge" style={{ color: subjectColor(course.category) }}>
                  {course.category}
                </div>
                <h4 className="course-block-title">{course.name}</h4>
                <div className="course-block-progress">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.floor(Math.random() * 60) + 20}%`,
                        background: subjectColor(course.category),
                      }}
                    />
                  </div>
                  <span className="progress-text">{course.topics?.length || 0} Modules</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-area dash-area--profile">
          <div className="dash-widget side-profile">
            <div className="side-avatar-container">
              <div className="side-avatar">{user?.firstName?.charAt(0) || 'U'}</div>
            </div>
            <h4 className="side-name">{user?.firstName} {user?.lastName}</h4>
            <p className="side-role">{user?.role === 'student' ? 'MDCAT Aspirant' : user?.role}</p>

            <div className="side-stats mt-4">
              <div className="stat-col">
                <span className="stat-value">{testSummary?.totalTests || 0}</span>
                <span className="stat-label">Tests Done</span>
              </div>
              <div className="stat-separator" />
              <div className="stat-col">
                <span className="stat-value">{testSummary?.avgPercentage || 0}%</span>
                <span className="stat-label">Avg. Score</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-area dash-area--chart">
          <div className="dash-activity-panel">
            <div className="panel-header">
              <h3>Training Progress</h3>
              <select className="minimal-select">
                <option>Last 6 months</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Area type="monotone" dataKey="score" stroke="var(--accent)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="dash-area dash-area--activity">
          <div className="dash-widget">
            <div className="panel-header mb-3">
              <h3>Recent Activity</h3>
              <button className="icon-btn" onClick={() => navigate('/notifications')} type="button" aria-label="Open notifications">
                More
              </button>
            </div>
            <div className="activity-list">
              {notifications.length > 0 ? notifications.map((notif) => (
                <div key={notif._id} className="activity-item">
                  <div className={`activity-dot ${notif.isRead ? '' : 'unread'}`} />
                  <div className="activity-content">
                    <p className="activity-title">{notif.title}</p>
                    <span className="activity-time">Just now</span>
                  </div>
                </div>
              )) : (
                <p className="text-muted text-sm">No new activities.</p>
              )}
            </div>
          </div>
        </div>

        <div className="dash-area dash-area--actions">
          <div className="dash-widget">
            <div className="panel-header mb-3">
              <h3>Quick Actions</h3>
            </div>
            <div className="todo-list">
              <button className="todo-item" onClick={() => navigate('/courses')} type="button">
                <div className="todo-icon bg-blue-light">CR</div>
                <div className="todo-text">Browse Courses</div>
              </button>
              <button className="todo-item" onClick={() => navigate('/performance')} type="button">
                <div className="todo-icon bg-purple-light">TS</div>
                <div className="todo-text">Take a Practice Test</div>
              </button>
              {isTeacher && (
                <button className="todo-item" onClick={() => navigate('/teacher/courses')} type="button">
                  <div className="todo-icon bg-green-light">MG</div>
                  <div className="todo-text">Manage Content</div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
