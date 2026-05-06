import axios from 'axios'
import { clearAuth, getAuthToken } from './authStorage'

const FALLBACK_API_BASE_URL = 'https://mdcatlms-production-4d20.up.railway.app/api'
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()

const API = axios.create({
  baseURL: configuredApiBaseUrl || FALLBACK_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
})

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
