import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query'

const CACHE_STORAGE_KEY = 'mdcat-query-cache-v2'
const CACHE_MAX_AGE_MS = 30 * 60 * 1000

// Persist to localStorage, not sessionStorage. sessionStorage is scoped to a
// single tab and is destroyed when that tab closes, so every fresh visit began
// with an empty cache and a blank-then-populate flash. localStorage survives tab
// closes and browser restarts, which is what makes a refresh feel instant.
// clearApiCache() still wipes it on login/logout, so no data outlives a session.
const storage = typeof window !== 'undefined' ? window.localStorage : null

// Keys that must never be written to disk, even inside the dehydrated blob.
const isPersistableKey = (queryKey) => {
  if (!Array.isArray(queryKey)) return false
  const url = String(queryKey[2] || '')
  // Don't persist one-shot or sensitive reads; they should always hit the network.
  return !/set-password|verify-email|forgot-password|reset-password/i.test(url)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data immediately, then refresh in the background. This is
      // what produces "data is already there" on navigation instead of a spinner.
      staleTime: 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Show cached data while a background refetch runs, rather than unmounting
      // into a loading state.
      placeholderData: (previous) => previous,
    },
  },
})

if (typeof window !== 'undefined' && storage) {
  try {
    const cached = JSON.parse(storage.getItem(CACHE_STORAGE_KEY) || 'null')
    if (cached?.savedAt > Date.now() - CACHE_MAX_AGE_MS && cached?.state) {
      hydrate(queryClient, cached.state)
    } else {
      storage.removeItem(CACHE_STORAGE_KEY)
    }
  } catch {
    storage.removeItem(CACHE_STORAGE_KEY)
  }

  let persistTimer
  queryClient.getQueryCache().subscribe(() => {
    window.clearTimeout(persistTimer)
    persistTimer = window.setTimeout(() => {
      try {
        const state = dehydrate(queryClient, {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && isPersistableKey(query.queryKey),
        })
        storage.setItem(
          CACHE_STORAGE_KEY,
          JSON.stringify({ savedAt: Date.now(), state }),
        )
      } catch {
        // Storage can be unavailable or full; in-memory caching still works.
      }
    }, 200)
  })
}

export const clearApiCache = () => {
  queryClient.clear()
  if (typeof window !== 'undefined' && storage) {
    storage.removeItem(CACHE_STORAGE_KEY)
  }
  // Remove the legacy sessionStorage copy written by earlier builds.
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(CACHE_STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

