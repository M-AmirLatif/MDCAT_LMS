import { useNavigate } from 'react-router-dom'
import './RoleTabs.css'

export default function RoleTabs({ user, showGuest = false }) {
  const navigate = useNavigate()
  if (!user?.role && !showGuest) return null

  const role = user?.role || 'guest'

  const canAccess = (target) => {
    if (role === 'guest') return false
    if (role === 'admin') return true
    if (role === 'teacher') return target === 'teacher' || target === 'student'
    return target === 'student'
  }

  const items = [
    { key: 'student', label: 'Student', path: '/dashboard' },
    { key: 'teacher', label: 'Teacher', path: '/teacher/mcqs' },
    { key: 'admin', label: 'Admin', path: '/admin' },
  ]

  const handleClick = (item) => {
    if (!user?.role) {
      navigate(`/login?next=${encodeURIComponent(item.path)}&role=${item.key}`)
      return
    }

    if (!canAccess(item.key)) {
      navigate(`/login?next=${encodeURIComponent(item.path)}&role=${item.key}`)
      return
    }

    navigate(item.path)
  }

  return (
    <div className="role-tabs">
      {items.map((item) => {
        const allowed = canAccess(item.key)
        const isActive = role === item.key
        return (
          <button
            key={item.key}
            className={`role-tab ${isActive ? 'active' : ''} ${
              !allowed ? 'locked' : ''
            }`}
            onClick={() => handleClick(item)}
            type="button"
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
