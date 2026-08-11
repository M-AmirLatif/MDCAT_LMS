import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import API from '../services/api'
import { mdcatSubjects } from '../pages/platformContent'
import { useAuth } from '../context/AuthContext'

export default function useMcqSubjectSummary() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['mcq-subject-summary', user?._id || user?.id || user?.email],
    queryFn: async () => {
      const res = await API.get('/mcqs/subjects/summary', { skipQueryCache: true })
      const summary = res.data?.subjects || []
      return mdcatSubjects.map((subject) => {
        const match = summary.find((item) => item.id === subject.id)
        return {
          ...subject,
          totalChapters: Number(match?.totalChapters) || 0,
          totalMcqs: Number(match?.totalMcqs) || 0,
        }
      })
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
  const subjects = query.data || mdcatSubjects
  const loading = query.isPending

  const totals = useMemo(() => ({
    totalMcqs: subjects.reduce((sum, subject) => sum + (subject.totalMcqs || 0), 0),
    totalChapters: subjects.reduce((sum, subject) => sum + (subject.totalChapters || 0), 0),
  }), [subjects])

  const teacherSummary = useMemo(() => (
    subjects.map((subject) => ({
      subject: subject.name,
      chapters: subject.totalChapters || 0,
      mcqs: subject.totalMcqs || 0,
      uploadedBy: subject.totalMcqs > 0 ? 'Live bank data' : 'No uploads yet',
    }))
  ), [subjects])

  return { subjects, totals, teacherSummary, loading }
}
