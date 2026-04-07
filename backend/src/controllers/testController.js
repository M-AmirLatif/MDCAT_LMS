const MCQ = require('../models/MCQ')
const TestSession = require('../models/TestSession')
const mongoose = require('mongoose')

const normalizeIndex = (value) => {
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : -1
}

// ==================== SUBMIT TEST (Student) ====================
exports.submitTest = async (req, res) => {
  try {
    const { courseId, answers } = req.body

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
    const evaluatedAnswers = []
    const results = []

    answers.forEach((answer) => {
      const mcq = mcqMap.get(String(answer.mcqId))
      if (!mcq) return

      const selectedIndex = normalizeIndex(answer.selectedIndex)
      const correctIndex = mcq.options.findIndex((opt) => opt.isCorrect)
      const isCorrect = selectedIndex === correctIndex

      if (isCorrect) score += 1

      evaluatedAnswers.push({
        mcqId: mcq._id,
        selectedIndex,
        correctIndex,
        isCorrect,
      })

      results.push({
        mcqId: mcq._id,
        selectedIndex,
        correctIndex,
        isCorrect,
        explanation: mcq.explanation || null,
      })
    })

    const totalQuestions = mcqs.length
    const percentage =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    const testSession = await TestSession.create({
      studentId: req.user.id,
      courseId,
      totalQuestions,
      score,
      percentage,
      submittedAt: new Date(),
      answers: evaluatedAnswers,
    })

    res.status(200).json({
      success: true,
      message: 'Test submitted successfully',
      testSessionId: testSession._id,
      score,
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
    const filter = { studentId: req.user.id }
    if (req.query.courseId && mongoose.Types.ObjectId.isValid(req.query.courseId)) {
      filter.courseId = req.query.courseId
    }

    const sessions = await TestSession.find(filter)
      .populate('courseId', 'name category')
      .select('courseId score totalQuestions percentage submittedAt')
      .sort({ submittedAt: -1 })
      .limit(50)

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET MY TEST SUMMARY ====================
exports.getMyTestSummary = async (req, res) => {
  try {
    const match = { studentId: new mongoose.Types.ObjectId(req.user.id) }
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
