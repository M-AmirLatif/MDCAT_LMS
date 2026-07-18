import axios from 'axios'
import { clearAuth, getAuthToken } from './authStorage'
import toast from 'react-hot-toast'

const FALLBACK_API_BASE_URL = 'https://mdcatlms-production-e781.up.railway.app/api'
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()
export const API_BASE_URL = configuredApiBaseUrl || FALLBACK_API_BASE_URL

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
})

const PUBLIC_ROUTE_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
])

const isPublicRequest = (config = {}) => {
  const requestUrl = String(config.url || '')
  return requestUrl.startsWith('/public/') || requestUrl.startsWith('public/')
}

const isPublicPage = () => {
  if (typeof window === 'undefined') return false
  return PUBLIC_ROUTE_PATHS.has(window.location.pathname)
}

export const getUserFriendlyErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const status = error?.response?.status
  const message = String(error?.response?.data?.error || '').trim()

  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.'
  }

  if (error?.message === 'Network Error' || !error?.response) {
    return 'The server is temporarily unavailable. Please try again in a moment.'
  }

  if (status >= 500) {
    return 'A server error occurred. Please try again shortly.'
  }

  if (message) return message
  return fallback
}

// Add token to requests
API.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ==================== RESPONSE INTERCEPTOR ====================
// Refined fallback retry strategy:
// - Only retry on GET (idempotent) requests to avoid double mutations
// - Only retry on genuine connectivity / infrastructure errors
// - Reduced fallback timeout to avoid long double-wait UX
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config
    const isRetryable =
      originalRequest &&
      !originalRequest.__retriedWithFallback &&
      FALLBACK_API_BASE_URL &&
      originalRequest.baseURL !== FALLBACK_API_BASE_URL &&
      // Only retry safe, idempotent methods to avoid double-mutations
      (!originalRequest.method || originalRequest.method.toUpperCase() === 'GET') &&
      (error.message === 'Network Error' ||
        error.code === 'ECONNABORTED' ||
        [502, 503, 504].includes(error.response?.status))

    if (isRetryable) {
      originalRequest.__retriedWithFallback = true
      originalRequest.baseURL = FALLBACK_API_BASE_URL
      // Use shorter timeout for fallback to avoid long stalls
      originalRequest.timeout = 10000
      return API.request(originalRequest)
    }

    if (error.response?.status === 401) {
      const isSessionSuperseded = error.response?.data?.error === 'SESSION_SUPERSEDED'
      const shouldRedirectToLogin = !isPublicPage() && !isPublicRequest(originalRequest)

      if (shouldRedirectToLogin) {
        clearAuth()
        if (isSessionSuperseded) {
          // Small delay so the toast appears after redirect
          sessionStorage.setItem('session_superseded', '1')
        }
        window.location.href = '/login'
      } else if (isSessionSuperseded) {
        clearAuth()
      }
    }

    const friendlyMessage = getUserFriendlyErrorMessage(error)
    if (!error.response) {
      error.response = { data: { error: friendlyMessage }, status: 0 }
    } else if (!error.response.data || typeof error.response.data !== 'object') {
      error.response.data = { error: friendlyMessage }
    } else if (error.response.status >= 500) {
      error.response.data.error = friendlyMessage
    }

    return Promise.reject(error)
  },
)

export default API
