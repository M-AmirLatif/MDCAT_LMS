const MCQ = require('../models/MCQ')
const TestSession = require('../models/TestSession')
const Course = require('../models/Course')
const mongoose = require('mongoose')
const { SUBJECTS, getTeacherSubjects, normalizeSubject } = require('../utils/teacherSubjects')

const buildTestFilter = async (req) => {
  const role = req.user.role?.name || ''
  if (role === 'teacher') {
    const subjects = getTeacherSubjects(req.user)
    if (!subjects.length) return { _id: null }

    const courses = await Course.find({
      $or: [
        { category: { $in: subjects } },
        { subject: { $in: subjects } },
      ],
    }).select('_id').lean()

    return {
      $or: [
        { subject: { $in: subjects } },
        { courseId: { $in: courses.map((course) => course._id) } },
      ],
    }
  } else if (role === 'admin') {
    return {}
  }
  return { studentId: new mongoose.Types.ObjectId(req.user.id) }
}

const normalizeIndex = (value) => {
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : -1
}

const normalizeImageArray = (...values) => {
  const urls = []
  const push = (value) => {
    if (!value) return
    if (Array.isArray(value)) return value.forEach(push)
    if (typeof value === 'object') return push(value.secure_url || value.secureUrl || value.url || value.src || value.imageUrl || value.fileUrl || value.absoluteUrl || value.publicUrl || value.location || value.path || value.href)
    let url = String(value || '').trim()
    const markdownMatch = url.match(/^!\[[^\]]*]\(([\s\S]+)\)$/)
    if (markdownMatch?.[1]) url = markdownMatch[1].trim()
    const tokenMatch = url.match(/^\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):\s*([\s\S]*?)\]$/i)
    if (tokenMatch?.[1]) url = tokenMatch[1].trim()
    const pipeIndex = url.indexOf('|')
    if (pipeIndex > -1) url = url.slice(0, pipeIndex).trim()
    if (url) urls.push(url)
  }
  values.forEach(push)
  return [...new Set(urls)]
}

const serializeMcqMedia = (mcq) => {
  if (!mcq) return {}
  const letters = ['A', 'B', 'C', 'D']
  const options = (mcq.options || []).map((option, index) => ({
    ...option,
    text: option.text || mcq[`option${letters[index]}`] || '',
    images: normalizeImageArray(
      option.images,
      option.imageUrl,
      option.imageUrls,
      option.src,
      option.url,
      mcq[`option${letters[index]}Images`],
      mcq[`option${letters[index]}Image`],
      mcq[`option${letters[index]}ImageUrl`],
      mcq[`option${letters[index]}ImageUrls`],
    ),
  }))
  return {
    ...mcq,
    question: mcq.questionText || mcq.question || '',
    questionText: mcq.questionText || mcq.question || '',
    questionImages: normalizeImageArray(
      mcq.questionImages,
      mcq.questionImage,
      mcq.questionImageUrl,
      mcq.questionImageUrls,
      mcq.imageUrl,
      mcq.imageUrls,
      mcq.images,
    ),
    options,
    explanation: mcq.explanationText || mcq.explanation || null,
    explanationText: mcq.explanationText || mcq.explanation || null,
    explanationImages: normalizeImageArray(
      mcq.explanationImages,
      mcq.explanationImage,
      mcq.explanationImageUrl,
      mcq.explanationImageUrls,
      mcq.explanationImagesUrl,
    ),
  }
}

// ==================== SUBMIT TEST (Student) ====================
exports.submitTest = async (req, res) => {
  try {
    const {
      courseId,
      answers,
      mcqIds: submittedMcqIds,
      topic,
      subject,
      chapterId,
      chapterName,
      enableNegativeMarking,
      timeLimitSeconds,
      timeSpentSeconds,
      startedAt,
    } = req.body

    const normalizedAnswers = Array.isArray(answers) ? answers : []
    const mcqIds = [
      ...new Set(
        [
          ...(Array.isArray(submittedMcqIds) ? submittedMcqIds : []),
          ...normalizedAnswers.map((a) => a?.mcqId),
        ].filter(Boolean),
      ),
    ]

    if (!courseId || mcqIds.length === 0) {
      return res.status(400).json({
        error: 'Please provide courseId and MCQs to submit',
      })
    }

    const mcqs = await MCQ.find({
      _id: { $in: mcqIds },
      courseId,
      isPublished: true,
    }).lean()

    if (mcqs.length === 0) {
      return res.status(404).json({ error: 'No MCQs found for submission' })
    }

    const mcqMap = new Map(mcqs.map((mcq) => [mcq._id.toString(), mcq]))
    const answerMap = new Map(
      normalizedAnswers
        .filter((answer) => answer?.mcqId)
        .map((answer) => [String(answer.mcqId), answer]),
    )

    let score = 0
    let negativeScore = 0
    const evaluatedAnswers = []
    const results = []

    mcqIds.forEach((mcqId) => {
      const mcq = mcqMap.get(String(mcqId))
      if (!mcq) return

      const answer = answerMap.get(String(mcqId)) || {}
      const selectedIndex = normalizeIndex(answer.selectedIndex)
      const correctIndex = mcq.options.findIndex((opt) => opt.isCorrect)
      const isCorrect = selectedIndex === correctIndex

      if (isCorrect) {
        score += 1
      } else if (enableNegativeMarking && selectedIndex >= 0) {
        // MDCAT style: -1 for wrong answer (only if student selected an option)
        negativeScore += 1
      }

      evaluatedAnswers.push({
        mcqId: mcq._id,
        selectedIndex,
        correctIndex,
        isCorrect,
      })

      const normalizedMcq = serializeMcqMedia(mcq)
      results.push({
        mcqId: mcq._id,
        question: normalizedMcq.question,
        questionText: normalizedMcq.questionText,
        questionImages: normalizedMcq.questionImages,
        options: normalizedMcq.options,
        selectedIndex,
        correctIndex,
        isCorrect,
        explanation: normalizedMcq.explanation,
        explanationText: normalizedMcq.explanationText,
        explanationImages: normalizedMcq.explanationImages,
        difficulty: mcq.difficulty || 'medium',
      })
    })

    const totalQuestions = mcqs.length
    const finalScore = Math.max(0, score - negativeScore)
    const percentage =
      totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0
    const submittedStartedAt = startedAt ? new Date(startedAt) : new Date()

    const testSession = await TestSession.create({
      studentId: req.user.id,
      courseId,
      topic: topic || null,
      subject: subject || null,
      chapterId: chapterId || null,
      chapterName: chapterName || topic || null,
      totalQuestions,
      score,
      negativeScore,
      finalScore,
      percentage,
      timeLimitSeconds: timeLimitSeconds || null,
      timeSpentSeconds: timeSpentSeconds || null,
      startedAt: Number.isNaN(submittedStartedAt.getTime())
        ? new Date()
        : submittedStartedAt,
      submittedAt: new Date(),
      answers: evaluatedAnswers,
    })

    res.status(200).json({
      success: true,
      message: 'Test submitted successfully',
      testSessionId: testSession._id,
      score,
      negativeScore,
      finalScore,
      totalQuestions,
      percentage,
      results,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET MY TEST HISTORY ====================
exports.getMyTestHistory = async (req, res) => {
  try {
    const filter = await buildTestFilter(req)
    if (req.query.courseId && mongoose.Types.ObjectId.isValid(req.query.courseId)) {
      if (!filter.courseId) {
        filter.courseId = req.query.courseId
      } else {
        // Intersect courseIds if teacher is filtering
        filter.courseId = req.query.courseId
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 20))

    const [total, sessions] = await Promise.all([
      TestSession.countDocuments(filter),
      TestSession.find(filter)
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'name category')
        .select(
          'courseId studentId subject chapterId chapterName score negativeScore finalScore totalQuestions percentage topic submittedAt timeSpentSeconds',
        )
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET MY TEST SUMMARY ====================
exports.getMyTestSummary = async (req, res) => {
  try {
    const match = await buildTestFilter(req)
    if (req.query.courseId && mongoose.Types.ObjectId.isValid(req.query.courseId)) {
      match.courseId = new mongoose.Types.ObjectId(req.query.courseId)
    }

    const summary = await TestSession.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
          bestPercentage: { $max: '$percentage' },
        },
      },
    ])

    const latest = await TestSession.findOne(match)
      .sort({ submittedAt: -1 })
      .select('percentage submittedAt')

    res.status(200).json({
      success: true,
      totalTests: summary[0]?.totalTests || 0,
      avgPercentage: Math.round(summary[0]?.avgPercentage || 0),
      bestPercentage: summary[0]?.bestPercentage || 0,
      latestPercentage: latest?.percentage || 0,
      latestAt: latest?.submittedAt || null,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET TEST DETAIL (Review Wrong Answers) ====================
exports.getTestDetail = async (req, res) => {
  try {
    const session = await TestSession.findOne({
      _id: req.params.sessionId,
      studentId: req.user.id,
    }).lean()

    if (!session) {
      return res.status(404).json({ error: 'Test session not found' })
    }

    // Get full MCQ data for review
    const mcqIds = session.answers.map((a) => a.mcqId)
    const mcqs = await MCQ.find({ _id: { $in: mcqIds } }).lean()
    const mcqMap = new Map(mcqs.map((m) => [m._id.toString(), m]))

    const detailedAnswers = session.answers.map((answer) => {
      const mcq = serializeMcqMedia(mcqMap.get(answer.mcqId.toString()))
      return {
        ...answer,
        question: mcq.question || '',
        questionText: mcq.questionText || '',
        questionImages: mcq.questionImages || [],
        options: mcq.options || [],
        explanation: mcq.explanation || null,
        explanationText: mcq.explanationText || null,
        explanationImages: mcq.explanationImages || [],
        topic: mcq?.topic || '',
        difficulty: mcq?.difficulty || 'medium',
      }
    })

    res.status(200).json({
      success: true,
      session: {
        ...session,
        answers: detailedAnswers,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getLeaderboardRows = async (match, currentUserId) => {
  const rows = await TestSession.aggregate([
    {
      $match: {
        ...match,
        totalQuestions: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$studentId',
        attempts: { $sum: 1 },
        totalQuestions: { $sum: '$totalQuestions' },
        totalScore: { $sum: '$finalScore' },
        averageAttemptPercentage: { $avg: '$percentage' },
        bestPercentage: { $max: '$percentage' },
        lastAttemptAt: { $max: '$submittedAt' },
        subjects: { $addToSet: '$subject' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $lookup: {
        from: 'roles',
        localField: 'student.role',
        foreignField: '_id',
        as: 'role',
      },
    },
    { $unwind: '$role' },
    {
      $match: {
        'role.name': 'student',
        'student.isActive': { $ne: false },
      },
    },
    {
      $addFields: {
        accuracy: {
          $cond: [
            { $gt: ['$totalQuestions', 0] },
            { $round: [{ $multiply: [{ $divide: ['$totalScore', '$totalQuestions'] }, 100] }, 0] },
            0,
          ],
        },
      },
    },
    {
      $sort: {
        accuracy: -1,
        totalQuestions: -1,
        attempts: -1,
        bestPercentage: -1,
        lastAttemptAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        studentId: '$_id',
        firstName: '$student.firstName',
        lastName: '$student.lastName',
        email: '$student.email',
        accuracy: 1,
        attempts: 1,
        totalQuestions: 1,
        totalScore: 1,
        averageAttemptPercentage: { $round: ['$averageAttemptPercentage', 0] },
        bestPercentage: 1,
        lastAttemptAt: 1,
        subjects: {
          $filter: {
            input: '$subjects',
            as: 'subject',
            cond: { $ne: ['$$subject', null] },
          },
        },
      },
    },
  ])

  return rows.map((row, index) => {
    const name = `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Student'
    return {
      ...row,
      studentId: String(row.studentId),
      rank: index + 1,
      name,
      isCurrentUser: currentUserId ? String(row.studentId) === String(currentUserId) : false,
    }
  })
}

// ==================== GET LEADERBOARD ====================
exports.getLeaderboard = async (req, res) => {
  try {
    const role = req.user.role?.name || ''
    const requestedSubject = normalizeSubject(req.query.subject)
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 50))
    const teacherSubjects = role === 'teacher' ? getTeacherSubjects(req.user) : []
    const visibleSubjects = role === 'teacher'
      ? teacherSubjects
      : SUBJECTS

    if (role === 'teacher' && !visibleSubjects.length) {
      return res.status(200).json({
        success: true,
        overall: [],
        subjects: [],
        currentStudent: null,
        summary: { totalRanked: 0, visibleSubjects: [] },
      })
    }

    if (requestedSubject && role === 'teacher' && !visibleSubjects.includes(requestedSubject)) {
      return res.status(403).json({ error: 'Not authorized to view this subject leaderboard' })
    }

    const subjectScope = requestedSubject
      ? [requestedSubject]
      : visibleSubjects
    const baseMatch = subjectScope.length ? { subject: { $in: subjectScope } } : {}
    const currentUserId = role === 'student' ? req.user.id : null
    const allOverallRows = await getLeaderboardRows(baseMatch, currentUserId)
    const overall = allOverallRows.slice(0, limit)
    const currentStudent = currentUserId
      ? allOverallRows.find((row) => row.isCurrentUser) || null
      : null

    const subjectLeaderboards = await Promise.all(
      visibleSubjects.map(async (subject) => {
        if (requestedSubject && subject !== requestedSubject) return null
        const rows = await getLeaderboardRows({ subject }, currentUserId)
        return {
          subject,
          rows: rows.slice(0, limit),
          currentStudent: currentUserId
            ? rows.find((row) => row.isCurrentUser) || null
            : null,
          totalRanked: rows.length,
        }
      }),
    )

    res.status(200).json({
      success: true,
      overall,
      subjects: subjectLeaderboards.filter(Boolean),
      currentStudent,
      summary: {
        totalRanked: allOverallRows.length,
        visibleSubjects,
        rankingMethod: 'weighted_accuracy_then_volume',
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
// ==================== GET SUBJECT-WISE PERFORMANCE ====================
exports.getSubjectWisePerformance = async (req, res) => {
  try {
    const match = await buildTestFilter(req)

    const data = await TestSession.aggregate([
      { $match: match },
      { $sort: { submittedAt: 1 } },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$subject', '$course.category'] },
          totalTests: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
          bestPercentage: { $max: '$percentage' },
          latestPercentage: { $last: '$percentage' },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { _id: 1 } },
    ])

    res.status(200).json({
      success: true,
      subjects: data.map((d) => ({
        subject: d._id,
        totalTests: d.totalTests,
        avgPercentage: Math.round(d.avgPercentage),
        bestPercentage: d.bestPercentage,
        latestPercentage: d.latestPercentage,
      })),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const normalizeAnalyticsSubject = (session) => {
  const raw = String(
    session?.subject || session?.courseId?.category || session?.courseId?.subject || '',
  ).trim().toLowerCase()
  return SUBJECTS.find((subject) => subject.toLowerCase() === raw) || ''
}

const getCompactSubjectBank = async (allowedSubjects = SUBJECTS) => {
  const courses = await Course.find({ category: { $in: allowedSubjects } })
    .select('_id category chapters')
    .lean()
  const counts = await MCQ.aggregate([
    { $match: { courseId: { $in: courses.map((course) => course._id) } } },
    { $group: { _id: '$subject', totalMcqs: { $sum: 1 } } },
  ])
  const courseBySubject = new Map(courses.map((course) => [course.category, course]))
  const countBySubject = new Map(counts.map((row) => [row._id, row.totalMcqs]))
  return allowedSubjects.map((subject) => ({
    id: subject.toLowerCase(),
    name: subject,
    totalChapters: courseBySubject.get(subject)?.chapters?.length || 0,
    totalMcqs: countBySubject.get(subject) || 0,
  }))
}

const compactSession = (session) => ({
  id: String(session._id),
  subject: normalizeAnalyticsSubject(session),
  chapter: session.chapterName || session.topic || 'Chapter practice',
  chapterId: session.chapterId || '',
  totalQuestions: Number(session.totalQuestions) || 0,
  correct: Number(session.finalScore ?? session.score) || 0,
  score: Number(session.percentage) || 0,
  submittedAt: session.submittedAt || null,
  student: session.studentId ? {
    id: String(session.studentId._id || session.studentId),
    firstName: session.studentId.firstName || '',
    lastName: session.studentId.lastName || '',
    email: session.studentId.email || '',
  } : null,
})

const formatOverviewDate = (value) => {
  if (!value) return 'Recent'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const buildStudentOverview = (bank, rawSessions) => {
  const sessions = rawSessions.map(compactSession).filter((session) => session.subject)
  const latestByPractice = new Map()
  sessions.forEach((session) => {
    const key = `${session.subject}::${session.chapterId || session.chapter}`
    latestByPractice.set(key, session)
  })

  const subjects = bank.map((subject) => {
    const attempts = [...latestByPractice.values()].filter((row) => row.subject === subject.name)
    const attemptedMcqs = attempts.reduce((sum, row) => sum + row.totalQuestions, 0)
    const correct = attempts.reduce((sum, row) => sum + row.correct, 0)
    return {
      ...subject,
      attemptedMcqs,
      accuracy: attemptedMcqs ? Math.round((correct / attemptedMcqs) * 100) : 0,
      theme: subject.name,
    }
  })
  const totalAttempted = subjects.reduce((sum, subject) => sum + subject.attemptedMcqs, 0)
  const totalCorrect = [...latestByPractice.values()].reduce((sum, row) => sum + row.correct, 0)
  const attemptedSubjects = subjects.filter((subject) => subject.attemptedMcqs > 0)
    .sort((a, b) => b.accuracy - a.accuracy)

  const trendSource = sessions.slice(-60)
  const running = new Map()
  const performanceTrend = trendSource.map((session, index) => {
    running.set(`${session.subject}::${session.chapterId || session.chapter}`, session)
    const row = {
      label: session.chapter,
      attemptLabel: `A${index + 1}`,
      attemptNumber: index + 1,
      attemptDate: formatOverviewDate(session.submittedAt),
      subject: session.subject,
      score: session.score,
    }
    SUBJECTS.forEach((subject) => {
      const values = [...running.values()].filter((item) => item.subject === subject)
      const total = values.reduce((sum, item) => sum + item.totalQuestions, 0)
      const correct = values.reduce((sum, item) => sum + item.correct, 0)
      row[subject] = total ? Math.round((correct / total) * 100) : null
    })
    return row
  })
  const overallTrend = performanceTrend.map((row) => {
    const current = trendSource.slice(0, row.attemptNumber)
    const total = current.reduce((sum, item) => sum + item.totalQuestions, 0)
    const correct = current.reduce((sum, item) => sum + item.correct, 0)
    return {
      label: row.label,
      attemptLabel: row.attemptLabel,
      attemptNumber: row.attemptNumber,
      attemptDate: row.attemptDate,
      Overall: total ? Math.round((correct / total) * 100) : 0,
      attemptScore: row.score,
    }
  })

  return {
    subjects,
    summary: {
      totalAttempted,
      totalMcqs: subjects.reduce((sum, subject) => sum + subject.totalMcqs, 0),
      overallAccuracy: totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
      bestSubject: attemptedSubjects[0]?.name || 'No attempts yet',
      weakestSubject: attemptedSubjects.at(-1)?.name || 'No attempts yet',
    },
    performanceTrend,
    overallTrend,
    practiceAttempts: [...sessions].reverse().slice(0, 6).map((session) => ({
      id: session.id,
      subject: session.subject,
      chapter: session.chapter,
      correct: session.correct,
      total: session.totalQuestions,
      score: session.score,
      date: formatOverviewDate(session.submittedAt),
    })),
  }
}

const buildTeacherOverview = (bank, rawSessions) => {
  const sessions = rawSessions.map(compactSession).filter((session) => session.subject)
  const studentMap = new Map()
  sessions.forEach((session) => {
    const id = session.student?.id || session.student?.email || 'unknown'
    const current = studentMap.get(id) || { student: session.student, sessions: [] }
    current.sessions.push(session)
    studentMap.set(id, current)
  })
  const studentRows = [...studentMap.values()].map(({ student, sessions: rows }) => {
    const score = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length)
      : 0
    return {
      name: [student?.firstName, student?.lastName].filter(Boolean).join(' ') || student?.email || 'Unknown',
      city: 'N/A',
      score,
      streak: `${rows.length} attempts`,
      risk: score < 50 ? 'High' : score < 70 ? 'Medium' : 'Low',
      email: student?.email || 'No email',
      trend: rows.slice(-30).map((row, index) => ({ label: `Attempt ${index + 1}`, score: row.score })),
    }
  }).sort((a, b) => b.score - a.score)
  const subjectMastery = SUBJECTS.map((subject) => {
    const rows = sessions.filter((session) => session.subject === subject)
    return {
      subject,
      score: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0,
    }
  })
  const scoreDistribution = [
    { band: '0-39%', min: 0, max: 39 },
    { band: '40-59%', min: 40, max: 59 },
    { band: '60-79%', min: 60, max: 79 },
    { band: '80-100%', min: 80, max: 100 },
  ].map(({ band, min, max }) => ({
    band,
    count: sessions.filter((session) => session.score >= min && session.score <= max).length,
  }))
  const topStudents = studentRows.slice(0, 3)
  const maxTrend = Math.max(0, ...topStudents.map((student) => student.trend.length))
  const multiStudentTrend = Array.from({ length: maxTrend }, (_, index) => {
    const row = { label: `Attempt ${index + 1}` }
    topStudents.forEach((student) => {
      if (student.trend[index]) row[student.name] = student.trend[index].score
    })
    return row
  })
  const totalChapters = bank.reduce((sum, subject) => sum + subject.totalChapters, 0)
  const attemptedChapters = new Set(sessions.map((session) => `${session.subject}:${session.chapterId || session.chapter}`))
  return {
    summary: {
      classAverage: sessions.length ? Math.round(sessions.reduce((sum, row) => sum + row.score, 0) / sessions.length) : 0,
      submissionRate: totalChapters ? Math.round((attemptedChapters.size / totalChapters) * 100) : 0,
      liveAttendance: 0,
      atRisk: studentRows.filter((student) => student.score < 50).length,
      totalAttempts: sessions.length,
    },
    scoreDistribution,
    subjectMastery,
    multiStudentTrend,
    studentRows,
  }
}

// One compact, pre-calculated response replaces repeated downloads of 200-1000
// raw test sessions on dashboard/performance/teacher pages.
exports.getPerformanceOverview = async (req, res) => {
  try {
    const role = req.user.role?.name || req.user.role || 'student'
    const filter = await buildTestFilter(req)
    const allowedSubjects = role === 'teacher' ? getTeacherSubjects(req.user) : SUBJECTS
    const [bank, sessions] = await Promise.all([
      getCompactSubjectBank(allowedSubjects),
      TestSession.find(filter)
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'category subject')
        .select('studentId courseId subject chapterId chapterName topic totalQuestions score finalScore percentage submittedAt')
        .sort({ submittedAt: 1 })
        .lean(),
    ])
    const data = role === 'student'
      ? buildStudentOverview(bank, sessions)
      : buildTeacherOverview(bank, sessions)
    res.set('Cache-Control', 'private, max-age=30')
    res.status(200).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}



