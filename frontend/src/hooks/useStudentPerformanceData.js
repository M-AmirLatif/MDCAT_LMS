import { useEffect, useState } from 'react'
import API from '../services/api'

const SUBJECTS = [
  { id: 'biology', name: 'Biology' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'physics', name: 'Physics' },
  { id: 'english', name: 'English' },
]

const EMPTY_SUMMARY = {
  totalAttempted: 0,
  totalMcqs: 0,
  overallAccuracy: 0,
  bestSubject: 'No attempts yet',
  weakestSubject: 'No attempts yet',
}

const formatAttemptDate = (value) => {
  if (!value) return 'Recent'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getSubjectNameFromSession = (session) => {
  const explicitSubject = String(session?.subject || '').trim()
  if (explicitSubject) return explicitSubject

  const courseCategory = String(session?.courseId?.category || '').trim()
  if (courseCategory) return courseCategory

  return ''
}

const buildPerformanceData = (subjectSummary = [], sessions = []) => {
  const normalizedSessions = sessions
    .map((session, index) => {
      const subject = getSubjectNameFromSession(session)
      if (!subject) return null

      return {
        id: session._id || `${subject}-${session.submittedAt || index}`,
        subject,
        chapter: session.chapterName || session.topic || 'Chapter practice',
        totalQuestions: Number(session.totalQuestions) || 0,
        score: Number(session.percentage) || 0,
        submittedAt: session.submittedAt || null,
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0))

  const sessionStats = new Map(
    SUBJECTS.map((subject) => [
      subject.name,
      { attemptedMcqs: 0, weightedCorrect: 0, weight: 0 },
    ]),
  )

  normalizedSessions.forEach((session) => {
    const stats = sessionStats.get(session.subject)
    if (!stats) return

    stats.attemptedMcqs += session.totalQuestions
    stats.weightedCorrect += (session.score / 100) * session.totalQuestions
    stats.weight += session.totalQuestions
  })

  const subjects = SUBJECTS.map((subject) => {
    const summaryMatch = subjectSummary.find((item) => item.id === subject.id)
    const stats = sessionStats.get(subject.name)
    const accuracy = stats?.weight ? Math.round((stats.weightedCorrect / stats.weight) * 100) : 0

    return {
      ...subject,
      totalChapters: Number(summaryMatch?.totalChapters) || 0,
      totalMcqs: Number(summaryMatch?.totalMcqs) || 0,
      attemptedMcqs: stats?.attemptedMcqs || 0,
      accuracy,
      theme: subject.name,
    }
  })

  const attemptedSubjects = subjects.filter((subject) => subject.attemptedMcqs > 0)
  const totalAttempted = subjects.reduce((sum, subject) => sum + subject.attemptedMcqs, 0)
  const totalMcqs = subjects.reduce((sum, subject) => sum + subject.totalMcqs, 0)
  const overallAccuracy = totalAttempted
    ? Math.round(
      subjects.reduce((sum, subject) => sum + (subject.accuracy * subject.attemptedMcqs), 0) / totalAttempted,
    )
    : 0
  const sortedSubjects = [...attemptedSubjects].sort((a, b) => b.accuracy - a.accuracy)

  const latestBySubject = Object.fromEntries(SUBJECTS.map((subject) => [subject.name, null]))
  const performanceTrend = normalizedSessions.map((session, index) => {
    latestBySubject[session.subject] = session.score
    return {
      label: session.chapter || `Attempt ${index + 1}`,
      attemptDate: formatAttemptDate(session.submittedAt),
      ...latestBySubject,
    }
  })

  const practiceAttempts = [...normalizedSessions]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 6)
    .map((session) => ({
      id: session.id,
      subject: session.subject,
      chapter: session.chapter,
      correct: Math.round((session.score / 100) * session.totalQuestions),
      total: session.totalQuestions,
      score: session.score,
      date: formatAttemptDate(session.submittedAt),
    }))

  return {
    subjects,
    summary: {
      ...EMPTY_SUMMARY,
      totalAttempted,
      totalMcqs,
      overallAccuracy,
      bestSubject: sortedSubjects[0]?.name || EMPTY_SUMMARY.bestSubject,
      weakestSubject: sortedSubjects.at(-1)?.name || EMPTY_SUMMARY.weakestSubject,
    },
    performanceTrend,
    practiceAttempts,
  }
}

export default function useStudentPerformanceData() {
  const [data, setData] = useState(() => buildPerformanceData())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      try {
        const [subjectRes, historyRes] = await Promise.all([
          API.get('/mcqs/subjects/summary'),
          API.get('/tests/my', { params: { page: 1, limit: 200 } }),
        ])

        if (!alive) return

        setData(
          buildPerformanceData(
            subjectRes.data?.subjects || [],
            historyRes.data?.sessions || [],
          ),
        )
      } catch {
        if (alive) setData(buildPerformanceData())
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  return { ...data, loading }
}
