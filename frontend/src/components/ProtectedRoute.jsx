import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { loading, token, user } = useAuth()

  if (loading) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        Loading secure workspace...
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (Array.isArray(roles) && roles.length > 0) {
    const allowed = roles.includes(user.role)
    if (!allowed) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
