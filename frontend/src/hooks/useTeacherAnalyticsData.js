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

  return { ...(query.data || EMPTY), loading: query.isPending }
}
