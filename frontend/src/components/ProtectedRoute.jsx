import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (Array.isArray(roles) && roles.length > 0) {
    const allowed =
      roles.includes(user.role) || user.role === 'superadmin'
    if (!allowed) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
