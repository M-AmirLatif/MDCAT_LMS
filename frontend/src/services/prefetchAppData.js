import API from './api'
import { queryClient } from './queryClient'
import {
  studentPerformanceQuery,
  subjectSummaryQuery,
  teacherPerformanceQuery,
} from './dataQueries'

const SUBJECT_IDS = ['biology', 'chemistry', 'physics', 'english']
const prefetchedScopes = new Set()

const runWhenIdle = (callback) => {
  if (typeof window === 'undefined') return
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1800 })
  } else {
    window.setTimeout(callback, 250)
  }
}

export const prefetchAppData = (user, { force = false } = {}) => {
  if (!user) return Promise.resolve()
  const scope = user._id || user.id || user.email
  if (!scope || (!force && prefetchedScopes.has(String(scope)))) return Promise.resolve()
  prefetchedScopes.add(String(scope))

  const role = user.role?.name || user.role || 'student'
  const critical = [queryClient.prefetchQuery(subjectSummaryQuery(user))]
  if (role === 'student') critical.push(queryClient.prefetchQuery(studentPerformanceQuery(user)))
  if (role === 'teacher' || role === 'admin') critical.push(queryClient.prefetchQuery(teacherPerformanceQuery(user)))

  const prefetchSecondaryData = () => runWhenIdle(() => {
    const secondary = [
      API.get('/notifications?limit=100').catch(() => null),
      API.get('/tests/leaderboard', { params: { limit: 50 } }).catch(() => null),
      API.get('/live-sessions').catch(() => null),
      ...SUBJECT_IDS.map((subject) =>
        API.get(`/mcqs/${subject}/chapters`).catch(() => null),
      ),
    ]

    if (role === 'student') {
      secondary.push(
        API.get('/payments/methods').catch(() => null),
        API.get('/payments/my-requests').catch(() => null),
        API.get('/subscriptions/my-subscriptions').catch(() => null),
      )
    }

    if (role === 'admin') {
      secondary.push(API.get('/admin/overview').catch(() => null))
    }

    Promise.allSettled(secondary)
  })

  return Promise.allSettled(critical).finally(prefetchSecondaryData)
}

export const resetPrefetchState = () => prefetchedScopes.clear()
