import axios from 'axios'
import { clearAuth, getAuthToken } from './authStorage'

const FALLBACK_API_BASE_URL = 'https://mdcatlms-production-4d20.up.railway.app/api'
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()

const API = axios.create({
  baseURL: configuredApiBaseUrl || FALLBACK_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000),
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
    const originalRequest = error.config
    const shouldRetryWithFallback =
      originalRequest &&
      !originalRequest.__retriedWithFallback &&
      FALLBACK_API_BASE_URL &&
      originalRequest.baseURL !== FALLBACK_API_BASE_URL &&
      (error.message === 'Network Error' ||
        error.code === 'ECONNABORTED' ||
        [404, 502, 503, 504].includes(error.response?.status))

    if (shouldRetryWithFallback) {
      originalRequest.__retriedWithFallback = true
      originalRequest.baseURL = FALLBACK_API_BASE_URL
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
