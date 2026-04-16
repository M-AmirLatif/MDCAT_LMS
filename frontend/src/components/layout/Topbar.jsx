import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Topbar.css'
import { getAuthUser } from '../../services/authStorage'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/courses': 'Browse Courses',
  '/performance': 'Performance',
  '/notifications': 'Notifications',
  '/live-sessions': 'Live Classes',
  '/payments': 'Payments',
  '/profile/edit': 'Edit Profile',
  '/teacher/courses': 'My Courses',
  '/teacher/courses/create': 'Create Course',
  '/live-sessions/create': 'Schedule Live Class',
  '/admin': 'Admin Panel',
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getAuthUser())
  }, [])

  const getPageTitle = () => {
    if (PAGE_TITLES[location.pathname]) return PAGE_TITLES[location.pathname]

    if (location.pathname.startsWith('/course/') && location.pathname.includes('/mcqs')) return 'MCQ Test'
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/create-mcq')) return 'Create MCQs'
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/create-lecture')) return 'Create Lecture'
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/assignments')) return 'Assignments'
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/create-assignment')) return 'Create Assignment'
    if (location.pathname.startsWith('/course/')) return 'Course Detail'
    if (location.pathname.startsWith('/lecture/')) return 'Lecture Player'
    if (location.pathname.startsWith('/test-review/')) return 'Test Review'
    if (location.pathname.startsWith('/teacher/courses/') && location.pathname.includes('/edit')) return 'Edit Course'
    if (location.pathname.startsWith('/assignments/')) return 'Assignment Submissions'

    return 'MDCAT LMS'
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-menu-btn"
          onClick={onMenuClick}
          type="button"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="topbar-title">{getPageTitle()}</h2>
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <span className="search-icon" aria-hidden="true">S</span>
          <input type="text" placeholder="Search..." aria-label="Search" />
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-brand-mobile">
          <span className="topbar-brand-icon" aria-hidden="true">M</span>
          <span>MDCAT LMS</span>
        </div>

        <button
          className="topbar-action-btn"
          onClick={() => navigate('/notifications')}
          type="button"
          aria-label="Notifications"
        >
          N
        </button>

        <button className="topbar-user" onClick={() => navigate('/profile/edit')} type="button">
          <div className="topbar-avatar">
            {user?.firstName?.charAt(0) || 'U'}
            {user?.lastName?.charAt(0) || ''}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.firstName || 'User'}</span>
            <span className="topbar-user-role">{user?.role || 'student'}</span>
          </div>
        </button>
      </div>
    </header>
  )
}
