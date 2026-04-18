import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Sidebar.css'
import { clearAuth, getAuthUser } from '../../services/authStorage'

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z"
        fill="currentColor"
      />
    </svg>
  ),
  courses: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 6.5 12 3l8 3.5-8 3.5L4 6.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 10.5 12 14l8-3.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 14.5 12 18l8-3.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  performance: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 19V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 19V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 19V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M15 17H9a4 4 0 0 1-4-4V10a7 7 0 1 1 14 0v3a4 4 0 0 1-4 4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  live: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 7h16v10H4V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 10.5v3l3-1.5-3-1.5Z" fill="currentColor" />
      <path d="M22 9.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 7h16v10H4V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 11h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  myCourses: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 6.5 12 3l8 3.5-8 3.5L4 6.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 10.5 12 14l8-3.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 14v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  createCourse: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 6.5 12 3l8 3.5-8 3.5L4 6.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 8h16v12H4V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M12 2 19 5v6c0 5-3 9-7 11C8 20 5 16 5 11V5l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 12.5 11 14l3.5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M10 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m6 9-3 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard, path: '/dashboard', roles: ['student', 'teacher', 'admin', 'superadmin'] },
      { key: 'courses', label: 'Browse Courses', icon: ICONS.courses, path: '/courses', roles: ['student', 'teacher', 'admin', 'superadmin'] },
      { key: 'performance', label: 'Performance', icon: ICONS.performance, path: '/performance', roles: ['student', 'teacher', 'admin', 'superadmin'] },
    ],
  },
  {
    label: 'Learning',
    items: [
      { key: 'notifications', label: 'Notifications', icon: ICONS.notifications, path: '/notifications', roles: ['student', 'teacher', 'admin', 'superadmin'] },
      { key: 'live-sessions', label: 'Live Classes', icon: ICONS.live, path: '/live-sessions', roles: ['student', 'teacher', 'admin', 'superadmin'] },
      { key: 'payments', label: 'Payments', icon: ICONS.payments, path: '/payments', roles: ['student', 'teacher', 'admin', 'superadmin'] },
    ],
  },
  {
    label: 'Teacher',
    items: [
      { key: 'teacher-courses', label: 'My Courses', icon: ICONS.myCourses, path: '/teacher/courses', roles: ['teacher', 'admin', 'superadmin'] },
      { key: 'create-course', label: 'Create Course', icon: ICONS.createCourse, path: '/teacher/courses/create', roles: ['teacher', 'admin', 'superadmin'] },
      { key: 'create-session', label: 'Schedule Class', icon: ICONS.schedule, path: '/live-sessions/create', roles: ['teacher', 'admin', 'superadmin'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { key: 'admin', label: 'Admin Panel', icon: ICONS.admin, path: '/admin', roles: ['admin', 'superadmin'] },
    ],
  },
]

export default function Sidebar({
  isOpen,
  onClose,
  currentPath,
  collapsed = false,
  onToggleCollapse,
}) {
  const navigate = useNavigate()
  const user = getAuthUser()
  const role = user?.role || 'student'
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth > 1024
  })

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth > 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleNav = (path) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const visibleSections = useMemo(() => {
    return NAV_SECTIONS.map((section) => {
      const visibleItems = section.items.filter(
        (item) => item.roles.includes(role) || role === 'superadmin',
      )
      return { ...section, visibleItems }
    }).filter((s) => s.visibleItems.length > 0)
  }, [role])

  const sidebarClass = useMemo(() => {
    const classes = ['sidebar']
    if (isOpen) classes.push('sidebar--open')
    if (collapsed) classes.push('sidebar--collapsed')
    return classes.join(' ')
  }, [collapsed, isOpen])

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-brand">
        <button
          className="sidebar-brand-btn"
          type="button"
          onClick={() => handleNav('/dashboard')}
          title="Go to Dashboard"
        >
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon" aria-hidden="true">
              M
            </span>
          </div>
          <div className="sidebar-brand-text">
            <h1>MDCAT LMS</h1>
            <span className="sidebar-tagline">Learning Platform</span>
          </div>
        </button>

        {isDesktop && (
          <button
            className="sidebar-collapse"
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14 7 9 12l5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {visibleSections.map((section) => (
          <div key={section.label} className="sidebar-section">
            <span className="sidebar-section-label">{section.label}</span>
            {section.visibleItems.map((item) => {
              const isActive =
                currentPath === item.path ||
                (item.path !== '/dashboard' && currentPath.startsWith(item.path))

              return (
                <button
                  key={item.key}
                  className={`sidebar-item ${isActive ? 'sidebar-item--active' : ''}`}
                  onClick={() => handleNav(item.path)}
                  type="button"
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-item-indicator" aria-hidden="true" />
                  <span className="sidebar-item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="sidebar-item-label">{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className="sidebar-item sidebar-item--profile"
          onClick={() => handleNav('/profile/edit')}
          type="button"
          title={collapsed ? 'Edit Profile' : undefined}
        >
          <span className="sidebar-item-indicator" aria-hidden="true" />
          <span className="sidebar-item-icon">{ICONS.profile}</span>
          <span className="sidebar-item-label">Edit Profile</span>
        </button>
        <button
          className="sidebar-item sidebar-item--logout"
          onClick={handleLogout}
          type="button"
          title={collapsed ? 'Logout' : undefined}
        >
          <span className="sidebar-item-indicator" aria-hidden="true" />
          <span className="sidebar-item-icon">{ICONS.logout}</span>
          <span className="sidebar-item-label">Logout</span>
        </button>
      </div>
    </aside>
  )
}
