import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import API from '../services/api'
import { clearAuth, getAuthToken, getAuthUser, setAuth, setStoredUser } from '../services/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Initialize from localStorage instantly — no loading flash for returning users
  const [user, setUser] = useState(() => getAuthUser())
  const [token, setToken] = useState(() => getAuthToken())
  // If we have a cached user, render immediately (loading = false)
  // Only show loading if there's a token but no cached user (edge case)
  const [loading, setLoading] = useState(() => !!getAuthToken() && !getAuthUser())

  useEffect(() => {
    let alive = true
    const verifyAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await API.get('/auth/profile')
        if (!alive) return
        // Silently update user if server data differs from cache
        setUser(res.data.user)
        setStoredUser(res.data.user)
      } catch {
        if (!alive) return
        logout()
      } finally {
        if (alive) setLoading(false)
      }
    }
    verifyAuth()
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback((tokenValue, userData, remember = true) => {
    setAuth({ token: tokenValue, user: userData, remember })
    setToken(tokenValue)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    setStoredUser(updatedUser)
  }, [])

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
