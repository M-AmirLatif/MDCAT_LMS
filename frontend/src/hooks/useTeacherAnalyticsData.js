import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { teacherPerformanceQuery } from '../services/dataQueries'

const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English']

const EMPTY = {
  summary: {
    classAverage: 0,
    submissionRate: 0,
    liveAttendance: 0,
    atRisk: 0,
    totalAttempts: 0,
  },
  scoreDistribution: [],
  subjectMastery: SUBJECTS.map((subject) => ({ subject, score: 0 })),
  multiStudentTrend: [],
  studentRows: [],
}

export default function useTeacherAnalyticsData() {
  const { user } = useAuth()
  const query = useQuery({
    ...teacherPerformanceQuery(user),
    placeholderData: (previousData) => previousData,
  })

  // Deep-safe merge against EMPTY. A truthy-but-partial payload (e.g. a stale
  // persisted cache written by an older build, or a degraded backend response)
  // used to leave studentRows/summary sub-fields undefined, and the dashboard's
  // `studentRows.slice(0, 5)` then threw into the ErrorBoundary. Every field is
  // now guaranteed present, and every list is guaranteed to be an array.
  const data = query.data || EMPTY
  return {
    summary: { ...EMPTY.summary, ...(data.summary || {}) },
    scoreDistribution: Array.isArray(data.scoreDistribution)
      ? data.scoreDistribution
      : EMPTY.scoreDistribution,
    subjectMastery: Array.isArray(data.subjectMastery)
      ? data.subjectMastery
      : EMPTY.subjectMastery,
    multiStudentTrend: Array.isArray(data.multiStudentTrend)
      ? data.multiStudentTrend
      : EMPTY.multiStudentTrend,
    studentRows: Array.isArray(data.studentRows) ? data.studentRows : EMPTY.studentRows,
    loading: query.isPending,
  }
}
