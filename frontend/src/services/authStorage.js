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

export const migrateGuestQuizData = (user) => {
  if (!user) return
  const userKey = user.email || user._id || user.id
  if (!userKey || userKey === 'guest') return

  try {
    for (const store of [localStorage, sessionStorage]) {
      const keysToMigrate = []
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i)
        if (
          key &&
          (key.startsWith('mcq-result-guest-') ||
            key.startsWith('mcq-draft-guest-') ||
            key.startsWith('mcq-course-test-guest-'))
        ) {
          keysToMigrate.push(key)
        }
      }

      keysToMigrate.forEach((oldKey) => {
        const value = store.getItem(oldKey)
        if (!value) return
        const newKey = oldKey.replace('-guest-', `-${userKey}-`)
        store.setItem(newKey, value)
      })
    }
  } catch (err) {
    console.error('Error migrating guest quiz data:', err)
  }
}

export const setAuth = ({ token, user, remember }) => {
  clearAuth()
  const store = remember ? localStorage : sessionStorage
  store.setItem(TOKEN_KEY, token)
  store.setItem(USER_KEY, JSON.stringify(user))
  if (user) {
    migrateGuestQuizData(user)
  }
}

export const setStoredUser = (user) => {
  const store = hasSessionToken() ? sessionStorage : localStorage
  store.setItem(USER_KEY, JSON.stringify(user))
  if (user) {
    migrateGuestQuizData(user)
  }
}

export const getRememberedCredentials = () => {
  const email = localStorage.getItem(REMEMBER_EMAIL_KEY) || ''
  return { email, remember: !!email }
}

// Security note: we intentionally do NOT store plaintext passwords in browser storage.
// Rely on the browser password manager via `autocomplete="current-password"` instead.
export const setRememberedCredentials = ({ email, remember }) => {
  for (const s of [localStorage, sessionStorage]) {
    s.removeItem(REMEMBER_EMAIL_KEY)
  }
  if (remember) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, email)
  }
}

export const clearRememberedCredentials = () => {
  for (const s of [localStorage, sessionStorage]) {
    s.removeItem(REMEMBER_EMAIL_KEY)
  }
}
