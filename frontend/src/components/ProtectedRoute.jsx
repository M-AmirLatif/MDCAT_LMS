import { Navigate } from 'react-router-dom'
import { getAuthToken, getAuthUser } from '../services/authStorage'

export default function ProtectedRoute({ children, roles }) {
  const token = getAuthToken()
  const user = getAuthUser()

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
