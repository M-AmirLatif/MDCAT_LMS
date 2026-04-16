import { createContext, useContext, useState, useEffect } from 'react'
import API from '../services/api'
import { clearAuth, getAuthToken, getAuthUser, setAuth, setStoredUser } from '../services/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getAuthUser())
  const [token, setToken] = useState(() => getAuthToken())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await API.get('/auth/profile')
        setUser(res.data.user)
        setStoredUser(res.data.user)
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    verifyAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = (tokenValue, userData, remember = true) => {
    setAuth({ token: tokenValue, user: userData, remember })
    setToken(tokenValue)
    setUser(userData)
  }

  const logout = () => {
    clearAuth()
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    setStoredUser(updatedUser)
  }

  const isAuthenticated = !!token && !!user
  const isTeacher =
    user?.role === 'teacher' ||
    user?.role === 'admin' ||
    user?.role === 'superadmin'
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isTeacher,
        isAdmin,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
