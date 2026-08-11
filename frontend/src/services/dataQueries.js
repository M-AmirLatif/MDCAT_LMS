import API from './api'

export const userCacheScope = (user) =>
  user?._id || user?.id || user?.email || 'guest'

export const studentPerformanceQuery = (user) => ({
  queryKey: ['student-performance-overview', userCacheScope(user)],
  queryFn: async () => {
    const response = await API.get('/tests/performance-overview')
    return response.data?.data || null
  },
  staleTime: 2 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
})

export const teacherPerformanceQuery = (user) => ({
  queryKey: ['teacher-performance-overview', userCacheScope(user)],
  queryFn: async () => {
    const response = await API.get('/tests/performance-overview')
    return response.data?.data || null
  },
  staleTime: 2 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
})

export const subjectSummaryQuery = (user) => ({
  queryKey: ['mcq-subject-summary-response', userCacheScope(user)],
  queryFn: async () => {
    const response = await API.get('/mcqs/subjects/summary')
    return response.data?.subjects || []
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
})
