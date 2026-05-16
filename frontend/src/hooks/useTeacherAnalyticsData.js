import { useEffect, useMemo, useState } from 'react'
import API from '../services/api'

const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English']

const EMPTY = {
  summary: {
    classAverage: 0,
    submissionRate: 0,
    liveAttendance: 0,
    atRisk: 0,
  },
  scoreDistribution: [],
  subjectMastery: SUBJECTS.map((subject) => ({ subject, score: 0 })),
  multiStudentTrend: [],
}

const getStudentName = (student) => {
  if (!student) return 'Unknown'
  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim()
  return name || student.email || 'Unknown'
}

const getSubjectName = (session) =>
  String(session?.subject || session?.courseId?.category || '').trim()

const buildAnalyticsData = (sessions = [], subjects = []) => {
  const totalChapters = subjects.reduce((sum, subject) => sum + (Number(subject.totalChapters) || 0), 0)
  const totalSessions = sessions.length
  const classAverage = totalSessions
    ? Math.round(sessions.reduce((sum, session) => sum + (Number(session.percentage) || 0), 0) / totalSessions)
    : 0

  const uniqueChapterAttempts = new Set(
    sessions
      .map((session) => session.chapterId || session.chapterName || session.topic)
      .filter(Boolean),
  )
  const submissionRate = totalChapters
    ? Math.round((uniqueChapterAttempts.size / totalChapters) * 100)
    : 0

  const studentScores = new Map()
  sessions.forEach((session) => {
    const studentName = getStudentName(session.studentId)
    const current = studentScores.get(studentName) || []
    current.push(Number(session.percentage) || 0)
    studentScores.set(studentName, current)
  })

  const atRisk = [...studentScores.values()].filter((scores) => {
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return avg < 50
  }).length

  const bands = [
    { band: '0-39%', min: 0, max: 39, count: 0 },
    { band: '40-59%', min: 40, max: 59, count: 0 },
    { band: '60-79%', min: 60, max: 79, count: 0 },
    { band: '80-100%', min: 80, max: 100, count: 0 },
  ]

  sessions.forEach((session) => {
    const percentage = Number(session.percentage) || 0
    const match = bands.find((band) => percentage >= band.min && percentage <= band.max)
    if (match) match.count += 1
  })

  const subjectMastery = SUBJECTS.map((subject) => {
    const subjectSessions = sessions.filter((session) => getSubjectName(session) === subject)
    const score = subjectSessions.length
      ? Math.round(subjectSessions.reduce((sum, session) => sum + (Number(session.percentage) || 0), 0) / subjectSessions.length)
      : 0
    return { subject, score }
  })

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0),
  )

  const topStudents = [...studentScores.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([name]) => name)

  const perStudentCounts = new Map(topStudents.map((name) => [name, 0]))
  const multiStudentTrend = sortedSessions.reduce((acc, session) => {
    const studentName = getStudentName(session.studentId)
    if (!perStudentCounts.has(studentName)) return acc

    perStudentCounts.set(studentName, (perStudentCounts.get(studentName) || 0) + 1)
    acc.push({
      label: `${studentName.split(' ')[0]} ${perStudentCounts.get(studentName)}`,
      [studentName]: Number(session.percentage) || 0,
    })
    return acc
  }, [])

  return {
    summary: {
      classAverage,
      submissionRate,
      liveAttendance: 0,
      atRisk,
    },
    scoreDistribution: bands.map(({ band, count }) => ({ band, count })),
    subjectMastery,
    multiStudentTrend,
  }
}

export default function useTeacherAnalyticsData() {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setLoading(true)
      try {
        const [historyRes, summaryRes] = await Promise.all([
          API.get('/tests/my', { params: { page: 1, limit: 200 } }),
          API.get('/mcqs/subjects/summary'),
        ])

        if (!alive) return

        setData(
          buildAnalyticsData(
            historyRes.data?.sessions || [],
            summaryRes.data?.subjects || [],
          ),
        )
      } catch {
        if (alive) setData(EMPTY)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  return useMemo(() => ({ ...data, loading }), [data, loading])
}
