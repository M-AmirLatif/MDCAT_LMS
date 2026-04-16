const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const REMEMBER_EMAIL_KEY = 'remember_email'

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const hasSessionToken = () => !!sessionStorage.getItem(TOKEN_KEY)

export const getAuthToken = () =>
  sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)

export const getAuthUser = () => {
  const sessionUser = sessionStorage.getItem(USER_KEY)
  if (sessionUser) return safeJsonParse(sessionUser)
  const localUser = localStorage.getItem(USER_KEY)
  if (localUser) return safeJsonParse(localUser)
  return null
}

export const clearAuth = () => {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(TOKEN_KEY)
    store.removeItem(USER_KEY)
  }
}

export const setAuth = ({ token, user, remember }) => {
  clearAuth()
  const store = remember ? localStorage : sessionStorage
  store.setItem(TOKEN_KEY, token)
  store.setItem(USER_KEY, JSON.stringify(user))
}

export const setStoredUser = (user) => {
  const store = hasSessionToken() ? sessionStorage : localStorage
  store.setItem(USER_KEY, JSON.stringify(user))
}

export const getRememberedCredentials = () => {
  const store = localStorage.getItem(REMEMBER_EMAIL_KEY) ? localStorage : sessionStorage
  const email = store.getItem(REMEMBER_EMAIL_KEY) || ''
  return { email }
}

// Security note: we intentionally do NOT store plaintext passwords in browser storage.
// Rely on the browser password manager via `autocomplete="current-password"` instead.
export const setRememberedCredentials = ({ email, remember }) => {
  const store = remember ? localStorage : sessionStorage
  for (const s of [localStorage, sessionStorage]) {
    s.removeItem(REMEMBER_EMAIL_KEY)
  }
  store.setItem(REMEMBER_EMAIL_KEY, email)
}

export const clearRememberedCredentials = () => {
  for (const s of [localStorage, sessionStorage]) {
    s.removeItem(REMEMBER_EMAIL_KEY)
  }
}
