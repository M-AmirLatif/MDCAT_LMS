import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query'

const CACHE_STORAGE_KEY = 'mdcat-query-cache-v1'
const CACHE_MAX_AGE_MS = 30 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

if (typeof window !== 'undefined') {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_STORAGE_KEY) || 'null')
    if (cached?.savedAt > Date.now() - CACHE_MAX_AGE_MS && cached?.state) {
      hydrate(queryClient, cached.state)
    } else {
      sessionStorage.removeItem(CACHE_STORAGE_KEY)
    }
  } catch {
    sessionStorage.removeItem(CACHE_STORAGE_KEY)
  }

  let persistTimer
  queryClient.getQueryCache().subscribe(() => {
    window.clearTimeout(persistTimer)
    persistTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({
          savedAt: Date.now(),
          state: dehydrate(queryClient),
        }))
      } catch {
        // Storage can be unavailable or full; in-memory caching still works.
      }
    }, 200)
  })
}

export const clearApiCache = () => {
  queryClient.clear()
  if (typeof window !== 'undefined') sessionStorage.removeItem(CACHE_STORAGE_KEY)
}

