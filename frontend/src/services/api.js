import axios from 'axios'
import { clearAuth, getAuthToken } from './authStorage'
import { queryClient } from './queryClient'

const FALLBACK_API_BASE_URL = 'https://api.acemdcat.com/api'
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()
export const API_BASE_URL = configuredApiBaseUrl || FALLBACK_API_BASE_URL

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
})

const networkGet = API.get.bind(API)

const stableSerialize = (value) => {
  if (value === null || value === undefined) return String(value)
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${key}:${stableSerialize(value[key])}`).join(',')}}`
  }
  return String(value)
}

const getCacheScope = () => {
  try {
    const rawUser = sessionStorage.getItem('user') || localStorage.getItem('user')
    const user = rawUser ? JSON.parse(rawUser) : null
    return String(user?._id || user?.id || user?.email || 'guest')
  } catch {
    return 'guest'
  }
}

const getStaleTime = (url = '') => {
  // Attempt results are invalidated immediately by every submit mutation. A short
  // window lets the chapter screen warm this request before Start Quiz is clicked.
  if (/latest-attempt/i.test(url)) return 30 * 1000
  if (/notifications|payments|subscriptions|auth\/profile/i.test(url)) return 30 * 1000
  if (/subjects\/summary|\/chapters(?:\?|$)|\/courses(?:\?|$)|public\/stats/i.test(url)) return 5 * 60 * 1000
  return 2 * 60 * 1000
}

// Central cache for every existing API.get call. This avoids a risky all-at-once
// page rewrite while giving route changes, StrictMode remounts, and refreshes one
// deduplicated, user-scoped source of server data.
API.get = (url, config = {}) => {
  if (config.skipQueryCache) {
    return networkGet(url, config)
  }

  const queryKey = [
    'api-get',
    getCacheScope(),
    String(url),
    stableSerialize(config.params || {}),
  ]

  return queryClient.fetchQuery({
    queryKey,
    staleTime: getStaleTime(String(url)),
    queryFn: async () => {
      const response = await networkGet(url, config)
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }
    },
  })
}

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
  const code = String(error?.response?.data?.code || '')

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You appear to be offline. Check your internet connection and try again.'
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.'
  }

  if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || !error?.response) {
    return 'The server is temporarily unavailable. Please try again in a moment.'
  }

  if (status === 429) {
    const seconds = Number(error?.response?.data?.retryAfterSeconds)
    return Number.isFinite(seconds) && seconds > 0
      ? `Too many attempts. Please wait ${seconds > 60 ? `${Math.ceil(seconds / 60)} minute(s)` : `${seconds} second(s)`} and try again.`
      : 'Too many attempts. Please wait a moment and try again.'
  }

  if (code === 'DB_UNAVAILABLE') {
    return 'The server is still starting up. Please try again in a few seconds.'
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
// Transient-failure retry.
//
// The previous implementation required `baseURL !== FALLBACK_API_BASE_URL`. In
// production VITE_API_BASE_URL is set to exactly the fallback URL, so that test
// was always false and NOTHING was ever retried — every momentary backend blip
// surfaced to the user. Sign-in was hit hardest because it is a POST and POSTs
// were excluded outright.
//
// Retries now cover: connection failures, timeouts, and 502/503/504 (including
// the API's own "still starting up" 503). Only safe methods plus the two
// session-minting auth POSTs are replayed, so no domain mutation can double-fire.
const RETRYABLE_STATUS = new Set([502, 503, 504])
const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 600

const REPLAYABLE_POST_PATHS = [/\/auth\/login\/?$/, /\/auth\/google\/?$/]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isTransientFailure = (error) =>
  error?.message === 'Network Error' ||
  error?.code === 'ERR_NETWORK' ||
  error?.code === 'ECONNABORTED' ||
  error?.code === 'ETIMEDOUT' ||
  RETRYABLE_STATUS.has(error?.response?.status)

const isReplayable = (config) => {
  const method = String(config?.method || 'get').toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true
  if (method === 'POST') {
    return REPLAYABLE_POST_PATHS.some((pattern) => pattern.test(String(config?.url || '')))
  }
  return false
}

const getRetryDelay = (error, attempt) => {
  // Honour Retry-After when the server sends one (the readiness gate does).
  const headerValue = Number(error?.response?.headers?.['retry-after'])
  if (Number.isFinite(headerValue) && headerValue > 0) {
    return Math.min(headerValue * 1000, 5000)
  }
  return RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 250
}

API.interceptors.response.use(
  (response) => {
    const method = String(response?.config?.method || 'get').toLowerCase()
    if (!['get', 'head', 'options'].includes(method)) {
      queryClient.invalidateQueries()
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false

    if (
      originalRequest &&
      !isOffline &&
      isTransientFailure(error) &&
      isReplayable(originalRequest)
    ) {
      const attempt = (originalRequest.__retryCount || 0) + 1
      if (attempt <= MAX_RETRIES) {
        originalRequest.__retryCount = attempt
        await sleep(getRetryDelay(error, attempt))

        // On the final attempt, try the known-good fallback host if we are not
        // already pointed at it.
        if (
          attempt === MAX_RETRIES &&
          FALLBACK_API_BASE_URL &&
          originalRequest.baseURL !== FALLBACK_API_BASE_URL
        ) {
          originalRequest.baseURL = FALLBACK_API_BASE_URL
          originalRequest.timeout = 10000
        }

        return API.request(originalRequest)
      }
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
