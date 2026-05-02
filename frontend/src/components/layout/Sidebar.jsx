import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getMobileNavForRole,
  getNavigationForRole,
  getRoleLabel,
  ROLE_BADGE_CLASSES,
} from '../../lib/platform'
import ThemeToggle from '../ThemeToggle'
import './Sidebar.css'

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z" fill="currentColor" />
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
      <path d="M8 19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 19V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 19V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  live: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 7h16v10H4V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 10.5v3l3-1.5-3-1.5Z" fill="currentColor" />
      <path d="M20 9.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 7h16v10H4V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 11h10M7 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M15 17H9a4 4 0 0 1-4-4V10a7 7 0 1 1 14 0v3a4 4 0 0 1-4 4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  students: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6 2a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 15 13Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20a5 5 0 0 1 10 0M14 20a4 4 0 0 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  assignments: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M8 4h8M8 8h8M6 4h.01M6 8h.01M6 12h.01M8 12h8M8 16h8M6 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 3h14v18H5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="m5 16 4-4 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5v14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  teachers: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M12 5 3 9l9 4 9-4-9-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 11.5v3c0 1.7 2.2 3.5 5 3.5s5-1.8 5-3.5v-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  announcements: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M5 12V8a2 2 0 0 1 2-2h8l4-2v16l-4-2H7a2 2 0 0 1-2-2v-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M5 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h5M10 13h4M10 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="m12 3 2 2.2 3-.2 1.6 2.5-1.2 2.7 1.2 2.8L17 15.5l-3-.2L12 17l-2-1.7-3 .2-1.6-2.5 1.2-2.8-1.2-2.7L7 5l3 .2L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  admins: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  logs: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M7 4h10l3 3v13H7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 4v3h3M10 11h6M10 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M12 3 2.7 19h18.6L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
      <path d="M10 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 12H3m3-3-3 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

function getIcon(name) {
  return ICONS[name] || ICONS.dashboard
}

export default function Sidebar({
  isOpen,
  onClose,
  currentPath,
  collapsed = false,
  onToggleCollapse,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const role = user?.role || 'student'
  const sections = getNavigationForRole(role)
  const mobileItems = getMobileNavForRole(role)
  const badgeClass = ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.student
  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase()

  const sidebarClass = useMemo(() => {
    const classes = ['sidebar']
    if (isOpen) classes.push('sidebar--open')
    if (collapsed) classes.push('sidebar--collapsed')
    return classes.join(' ')
  }, [collapsed, isOpen])

  const go = (path) => {
    navigate(path)
    onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <aside className={sidebarClass}>
        <div className="sidebar-brand">
          <button className="sidebar-brand-btn" type="button" onClick={() => go('/dashboard')}>
            <div className="sidebar-logo">M</div>
            <div className="sidebar-brand-copy">
              <div className="sidebar-brand-title">MDCAT LMS</div>
              <div className="sidebar-brand-subtitle">Pakistan Medical Prep</div>
            </div>
          </button>

          <button
            className="sidebar-collapse"
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path d={collapsed ? 'm10 7 5 5-5 5' : 'm14 7-5 5 5 5'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="sidebar-role-row">
          <span className={`badge ${badgeClass}`}>{getRoleLabel(role)}</span>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.label} className="sidebar-section">
              <div className="sidebar-section-label">{section.label}</div>
              <div className="sidebar-section-items">
                {section.items.map((item) => {
                  const active =
                    currentPath === item.path ||
                    (item.path !== '/dashboard' && currentPath.startsWith(item.path))

                  return (
                    <button
                      key={item.key}
                      className={`sidebar-item ${active ? 'sidebar-item--active' : ''}`}
                      type="button"
                      onClick={() => go(item.path)}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="sidebar-item-icon">{getIcon(item.icon)}</span>
                      <span className="sidebar-item-label">{item.label}</span>
                      {item.badge ? <span className="sidebar-item-badge">{item.badge}</span> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-usercard" type="button" onClick={() => go('/profile/edit')}>
            <div className="sidebar-usercard-avatar">{initials}</div>
            <div className="sidebar-usercard-meta">
              <div className="sidebar-usercard-name">
                {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : 'MDCAT User'}
              </div>
              <div className="sidebar-usercard-role">{getRoleLabel(role)}</div>
            </div>
          </button>

          <div className="sidebar-section-label sidebar-section-label--footer">ACCOUNT</div>
          <button className="sidebar-item sidebar-item--footer sidebar-item--logout" type="button" onClick={handleLogout}>
            <span className="sidebar-item-icon">{getIcon('logout')}</span>
            <span className="sidebar-item-label">Logout</span>
          </button>
        </div>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <div className="mobile-bottom-nav-inner">
          {mobileItems.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

            return (
              <button
                key={item.key}
                className={`mobile-nav-item ${active ? 'mobile-nav-item--active' : ''}`}
                type="button"
                onClick={() => go(item.path)}
              >
                <span className="mobile-nav-item-icon">{getIcon(item.icon)}</span>
                <span className="mobile-nav-item-label">{item.label}</span>
              </button>
            )
          })}
          <ThemeToggle className="theme-toggle--mobile-nav" />
          <button
            className="mobile-nav-item mobile-nav-item--logout"
            type="button"
            onClick={handleLogout}
          >
            <span className="mobile-nav-item-icon">{getIcon('logout')}</span>
            <span className="mobile-nav-item-label">Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}
