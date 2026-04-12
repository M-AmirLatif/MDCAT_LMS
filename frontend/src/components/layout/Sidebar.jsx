import { useNavigate } from 'react-router-dom'
import './Sidebar.css'

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard', roles: ['student', 'teacher', 'admin', 'superadmin'] },
      { key: 'courses', label: 'Browse Courses', icon: '📚', path: '/courses', roles: ['student', 'teacher', 'admin', 'superadmin'] },
      { key: 'performance', label: 'Performance', icon: '📈', path: '/performance', roles: ['student', 'teacher', 'admin', 'superadmin'] },
    ],
  },
  {
    label: 'Learning',
    items: [
      { key: 'notifications', label: 'Notifications', icon: '🔔', path: '/notifications', roles: ['student', 'teacher', 'admin', 'superadmin'] },
      { key: 'live-sessions', label: 'Live Classes', icon: '🎥', path: '/live-sessions', roles: ['student', 'teacher', 'admin', 'superadmin'] },
      { key: 'payments', label: 'Payments', icon: '💳', path: '/payments', roles: ['student', 'teacher', 'admin', 'superadmin'] },
    ],
  },
  {
    label: 'Teacher',
    items: [
      { key: 'teacher-courses', label: 'My Courses', icon: '📝', path: '/teacher/courses', roles: ['teacher', 'admin', 'superadmin'] },
      { key: 'create-course', label: 'Create Course', icon: '➕', path: '/teacher/courses/create', roles: ['teacher', 'admin', 'superadmin'] },
      { key: 'create-session', label: 'Schedule Class', icon: '📅', path: '/live-sessions/create', roles: ['teacher', 'admin', 'superadmin'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { key: 'admin', label: 'Admin Panel', icon: '⚙️', path: '/admin', roles: ['admin', 'superadmin'] },
    ],
  },
]

export default function Sidebar({ isOpen, onClose, currentPath }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const role = user?.role || 'student'

  const handleNav = (path) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getRoleBadge = () => {
    const map = {
      student: { label: 'Student', cls: 'role-student' },
      teacher: { label: 'Teacher', cls: 'role-teacher' },
      admin: { label: 'Admin', cls: 'role-admin' },
      superadmin: { label: 'Super Admin', cls: 'role-superadmin' },
    }
    return map[role] || map.student
  }

  const roleBadge = getRoleBadge()

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand" onClick={() => handleNav('/dashboard')}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🧬</span>
        </div>
        <div className="sidebar-brand-text">
          <h1>MDCAT LMS</h1>
          <span className="sidebar-tagline">Learning Platform</span>
        </div>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.firstName?.charAt(0) || 'U'}
          {user?.lastName?.charAt(0) || ''}
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className={`sidebar-role-badge ${roleBadge.cls}`}>
            {roleBadge.label}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => item.roles.includes(role) || role === 'superadmin'
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={section.label} className="sidebar-section">
              <span className="sidebar-section-label">{section.label}</span>
              {visibleItems.map((item) => {
                const isActive =
                  currentPath === item.path ||
                  (item.path !== '/dashboard' && currentPath.startsWith(item.path))
                return (
                  <button
                    key={item.key}
                    className={`sidebar-item ${isActive ? 'sidebar-item--active' : ''}`}
                    onClick={() => handleNav(item.path)}
                    type="button"
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    <span className="sidebar-item-label">{item.label}</span>
                    {isActive && <span className="sidebar-item-indicator" />}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        <button
          className="sidebar-item sidebar-item--profile"
          onClick={() => handleNav('/profile/edit')}
          type="button"
        >
          <span className="sidebar-item-icon">👤</span>
          <span className="sidebar-item-label">Edit Profile</span>
        </button>
        <button
          className="sidebar-item sidebar-item--logout"
          onClick={handleLogout}
          type="button"
        >
          <span className="sidebar-item-icon">🚪</span>
          <span className="sidebar-item-label">Logout</span>
        </button>
      </div>
    </aside>
  )
}
