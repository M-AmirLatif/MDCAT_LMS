import { useEffect, useState } from 'react'
import API from '../services/api'

const SUBJECTS = [
  { id: 'biology', name: 'Biology' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'physics', name: 'Physics' },
  { id: 'english', name: 'English' },
]

const SUBJECT_NAME_BY_KEY = new Map(
  SUBJECTS.flatMap((subject) => [
    [subject.id, subject.name],
    [subject.name.toLowerCase(), subject.name],
  ]),
)

const normalizeSubjectName = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const key = raw.toLowerCase()
  if (SUBJECT_NAME_BY_KEY.has(key)) {
    return SUBJECT_NAME_BY_KEY.get(key)
  }

  const matchedSubject = SUBJECTS.find((subject) => {
    const id = subject.id.toLowerCase()
    const name = subject.name.toLowerCase()
    return key.includes(id) || key.includes(name)
  })

  return matchedSubject?.name || ''
}

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
  const explicitSubject = normalizeSubjectName(session?.subject)
  if (explicitSubject) {
    return explicitSubject
  }

  const courseCategory = normalizeSubjectName(session?.courseId?.category)
  if (courseCategory) {
    return courseCategory
  }

  return normalizeSubjectName(session?.courseId?.subject || session?.subjectName || session?.courseId?.name)
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
        practiceKey: [subject, session.chapterId || '', session.chapterName || session.topic || 'Chapter practice'].join('::'),
        totalQuestions: Number(session.totalQuestions) || 0,
        correct: Number(session.finalScore ?? session.score) || 0,
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

  const latestSessionByPractice = new Map()
  normalizedSessions.forEach((session) => {
    const existing = latestSessionByPractice.get(session.practiceKey)
    if (!existing || new Date(session.submittedAt || 0) >= new Date(existing.submittedAt || 0)) {
      latestSessionByPractice.set(session.practiceKey, session)
    }
  })

  latestSessionByPractice.forEach((session) => {
    const stats = sessionStats.get(session.subject)
    if (!stats) return

    stats.attemptedMcqs += session.totalQuestions
    stats.weightedCorrect += session.correct
    stats.weight += session.totalQuestions
  })

  const subjects = SUBJECTS.map((subject) => {
    const summaryMatch = subjectSummary.find((item) => {
      const itemId = String(item.id || item._id || '').toLowerCase()
      const itemName = String(item.name || item.subject || '').toLowerCase()
      return itemId === subject.id || itemName === subject.name.toLowerCase()
    })
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
  const runningLatestByPractice = new Map()
  const performanceTrend = normalizedSessions.map((session, index) => {
    runningLatestByPractice.set(session.practiceKey, session)

    SUBJECTS.forEach((subject) => {
      const subjectSessions = [...runningLatestByPractice.values()].filter((item) => item.subject === subject.name)
      const total = subjectSessions.reduce((sum, item) => sum + item.totalQuestions, 0)
      const correct = subjectSessions.reduce((sum, item) => sum + item.correct, 0)
      latestBySubject[subject.name] = total ? Math.round((correct / total) * 100) : null
    })

    return {
      label: session.chapter || `Attempt ${index + 1}`,
      attemptLabel: `A${index + 1}`,
      attemptNumber: index + 1,
      attemptDate: formatAttemptDate(session.submittedAt),
      subject: session.subject,
      score: session.score,
      ...latestBySubject,
    }
  })

  const runningLatestOverall = new Map()
  const overallTrend = normalizedSessions.map((session, index) => {
    runningLatestOverall.set(session.practiceKey, session)
    const runningCorrect = [...runningLatestOverall.values()].reduce((sum, item) => sum + item.correct, 0)
    const runningTotal = [...runningLatestOverall.values()].reduce((sum, item) => sum + item.totalQuestions, 0)
    return {
      label: session.chapter || `Attempt ${index + 1}`,
      attemptLabel: `A${index + 1}`,
      attemptNumber: index + 1,
      attemptDate: formatAttemptDate(session.submittedAt),
      Overall: runningTotal ? Math.round((runningCorrect / runningTotal) * 100) : 0,
      attemptScore: session.score,
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
    overallTrend,
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


