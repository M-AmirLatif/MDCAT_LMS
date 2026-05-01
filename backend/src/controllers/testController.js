const MCQ = require('../models/MCQ')
const TestSession = require('../models/TestSession')
const Course = require('../models/Course')
const mongoose = require('mongoose')

const buildTestFilter = async (req) => {
  const role = req.user.role?.name || ''
  if (role === 'teacher') {
    const courses = await Course.find({ createdBy: req.user.id }).select('_id')
    const courseIds = courses.map(c => c._id)
    return { courseId: { $in: courseIds } }
  } else if (role === 'admin' || role === 'superadmin') {
    return {}
  }
  return { studentId: new mongoose.Types.ObjectId(req.user.id) }
}

const normalizeIndex = (value) => {
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : -1
}

// ==================== SUBMIT TEST (Student) ====================
exports.submitTest = async (req, res) => {
  try {
    const {
      courseId,
      answers,
      topic,
      subject,
      chapterId,
      chapterName,
      enableNegativeMarking,
      timeLimitSeconds,
      timeSpentSeconds,
    } = req.body

    if (!courseId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        error: 'Please provide courseId and answers',
      })
    }

    const mcqIds = [...new Set(answers.map((a) => a.mcqId).filter(Boolean))]

    const mcqs = await MCQ.find({
      _id: { $in: mcqIds },
      courseId,
      isPublished: true,
    }).lean()

    if (mcqs.length === 0) {
      return res.status(404).json({ error: 'No MCQs found for submission' })
    }

    const mcqMap = new Map(mcqs.map((mcq) => [mcq._id.toString(), mcq]))

    let score = 0
    let negativeScore = 0
    const evaluatedAnswers = []
    const results = []

    answers.forEach((answer) => {
      const mcq = mcqMap.get(String(answer.mcqId))
      if (!mcq) return

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

      results.push({
        mcqId: mcq._id,
        question: mcq.question,
        options: mcq.options,
        selectedIndex,
        correctIndex,
        isCorrect,
        explanation: mcq.explanation || null,
        difficulty: mcq.difficulty || 'medium',
      })
    })

    const totalQuestions = mcqs.length
    const finalScore = Math.max(0, score - negativeScore)
    const percentage =
      totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0

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
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20))

    const [total, sessions] = await Promise.all([
      TestSession.countDocuments(filter),
      TestSession.find(filter)
        .populate('courseId', 'name category')
        .select('courseId studentId score negativeScore finalScore totalQuestions percentage topic submittedAt timeSpentSeconds')
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
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
      const mcq = mcqMap.get(answer.mcqId.toString())
      return {
        ...answer,
        question: mcq?.question || '',
        options: mcq?.options || [],
        explanation: mcq?.explanation || null,
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
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $group: {
          _id: '$course.category',
          totalTests: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
          bestPercentage: { $max: '$percentage' },
          latestPercentage: { $last: '$percentage' },
        },
      },
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
