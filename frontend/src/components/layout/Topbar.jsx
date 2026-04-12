import { useLocation } from 'react-router-dom'
import './Topbar.css'

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

  const getPageTitle = () => {
    // Exact match first
    if (PAGE_TITLES[location.pathname]) return PAGE_TITLES[location.pathname]

    // Pattern matches
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/mcqs'))
      return 'MCQ Test'
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/create-mcq'))
      return 'Create MCQs'
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/create-lecture'))
      return 'Create Lecture'
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/assignments'))
      return 'Assignments'
    if (location.pathname.startsWith('/course/') && location.pathname.includes('/create-assignment'))
      return 'Create Assignment'
    if (location.pathname.startsWith('/course/'))
      return 'Course Detail'
    if (location.pathname.startsWith('/lecture/'))
      return 'Lecture Player'
    if (location.pathname.startsWith('/test-review/'))
      return 'Test Review'
    if (location.pathname.startsWith('/teacher/courses/') && location.pathname.includes('/edit'))
      return 'Edit Course'
    if (location.pathname.startsWith('/assignments/'))
      return 'Assignment Submissions'

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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="topbar-title">{getPageTitle()}</h2>
      </div>

      <div className="topbar-right">
        <div className="topbar-brand-mobile">
          <span className="topbar-brand-icon">🧬</span>
          <span>MDCAT LMS</span>
        </div>
      </div>
    </header>
  )
}
