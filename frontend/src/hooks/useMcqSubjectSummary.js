import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mdcatSubjects } from '../pages/platformContent'
import { useAuth } from '../context/AuthContext'
import { subjectSummaryQuery } from '../services/dataQueries'

export default function useMcqSubjectSummary() {
  const { user } = useAuth()
  const query = useQuery({
    ...subjectSummaryQuery(user),
    placeholderData: (previousData) => previousData,
  })
  const subjects = useMemo(() => {
    const summary = query.data || []
    return mdcatSubjects.map((subject) => {
      const match = summary.find((item) => item.id === subject.id)
      return {
        ...subject,
        totalChapters: Number(match?.totalChapters) || 0,
        totalMcqs: Number(match?.totalMcqs) || 0,
      }
    })
  }, [query.data])
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
