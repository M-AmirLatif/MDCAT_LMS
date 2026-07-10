const MCQ = require('../models/MCQ')
const TestSession = require('../models/TestSession')
const mongoose = require('mongoose')
const { getTeacherSubjects } = require('../utils/teacherSubjects')

const buildTestFilter = async (req) => {
  const role = req.user.role?.name || ''
  if (role === 'teacher') {
    const subjects = getTeacherSubjects(req.user)
    return subjects.length ? { subject: { $in: subjects } } : { _id: null }
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
    if (typeof value === 'object') return push(value.url || value.src || value.imageUrl || value.secure_url || value.path)
    const url = String(value || '').trim()
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
    images: normalizeImageArray(option.images, mcq[`option${letters[index]}Images`]),
  }))
  return {
    ...mcq,
    question: mcq.questionText || mcq.question || '',
    questionText: mcq.questionText || mcq.question || '',
    questionImages: normalizeImageArray(mcq.questionImages),
    options,
    explanation: mcq.explanationText || mcq.explanation || null,
    explanationText: mcq.explanationText || mcq.explanation || null,
    explanationImages: normalizeImageArray(mcq.explanationImages),
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
