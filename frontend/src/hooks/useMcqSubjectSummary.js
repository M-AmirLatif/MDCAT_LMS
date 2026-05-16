import { useEffect, useMemo, useState } from 'react'
import API from '../services/api'
import { mdcatSubjects } from '../pages/platformContent'

export default function useMcqSubjectSummary() {
  const [subjects, setSubjects] = useState(mdcatSubjects)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      try {
        const res = await API.get('/mcqs/subjects/summary')
        if (!alive) return

        const summary = res.data?.subjects || []
        setSubjects(
          mdcatSubjects.map((subject) => {
            const match = summary.find((item) => item.id === subject.id)
            return {
              ...subject,
              totalChapters: Number(match?.totalChapters) || 0,
              totalMcqs: Number(match?.totalMcqs) || 0,
            }
          }),
        )
      } catch {
        if (alive) setSubjects(mdcatSubjects)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

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
