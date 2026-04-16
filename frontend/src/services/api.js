import axios from 'axios'
import { clearAuth, getAuthToken } from './authStorage'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Add token to requests
API.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses globally — redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      // Only redirect if not already on login/register pages
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register' && path !== '/verify-email') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default API
