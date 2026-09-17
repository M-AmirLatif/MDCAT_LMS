const MCQ = require('../models/MCQ')
const McqReport = require('../models/McqReport')
const { getTeacherSubjects, canTeacherAccessSubject } = require('../utils/teacherSubjects')

// Helper to determine user role
const isUserAdmin = (user) => {
  const role = String(user?.role || '').toLowerCase()
  return role === 'admin' || role === 'superadmin'
}

// POST /api/reports/mcq - Student submits report
exports.createReport = async (req, res) => {
  try {
    const {
      mcqId,
      issueType = 'wrong_key',
      description,
      selectedOption = '',
      chapterId = '',
      chapterName = '',
      subject: reqSubject = '',
      topic = '',
    } = req.body

    if (!mcqId) {
      return res.status(400).json({ error: 'MCQ ID is required' })
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Please describe the issue found in the MCQ' })
    }

    // Attempt to fetch MCQ from DB to snapshot details accurately
    const mcq = await MCQ.findById(mcqId).lean()
    
    let reportSubject = reqSubject || (mcq ? mcq.subject : 'Biology')
    let reportChapterId = chapterId || (mcq ? mcq.chapterId : '')
    let reportChapterName = chapterName || (mcq ? mcq.chapterName : '')
    let reportTopic = topic || (mcq ? mcq.topic : '')
    let snapshot = mcq ? (mcq.question || mcq.questionText || '') : ''

    const reportData = {
      mcqId,
      studentId: req.user?._id || null,
      studentName: req.user
        ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.name || 'Student'
        : 'Anonymous Student',
      studentEmail: req.user?.email || '',
      subject: reportSubject,
      chapterId: reportChapterId,
      chapterName: reportChapterName,
      topic: reportTopic,
      questionSnapshot: snapshot,
      issueType,
      description: description.trim(),
      selectedOption,
      status: 'pending',
    }

    const report = await McqReport.create(reportData)

    return res.status(201).json({
      success: true,
      message: 'MCQ issue reported successfully. Our subject specialists will review and correct it.',
      report,
    })
  } catch (error) {
    console.error('Error creating MCQ report:', error)
    return res.status(500).json({ error: error.message || 'Failed to submit report' })
  }
}

// GET /api/reports/teacher - Teacher / Admin gets reports scoped to assigned subjects
exports.getTeacherReports = async (req, res) => {
  try {
    const user = req.user
    const isAdmin = isUserAdmin(user)
    const { status = 'pending', subject, page = 1, limit = 50 } = req.query

    const query = {}

    // Status filter
    if (status && status !== 'all') {
      query.status = status
    }

    // Subject scope & filter
    if (!isAdmin) {
      const allowedSubjects = getTeacherSubjects(user)
      if (subject) {
        if (!canTeacherAccessSubject(user, subject)) {
          return res.status(403).json({ error: 'You are not assigned to this subject' })
        }
        query.subject = subject
      } else {
        if (allowedSubjects.length > 0) {
          query.subject = { $in: allowedSubjects }
        } else {
          // If teacher has no assigned subjects, return empty
          return res.status(200).json({
            success: true,
            reports: [],
            total: 0,
            page: Number(page),
            pages: 0,
            allowedSubjects: [],
          })
        }
      }
    } else {
      if (subject && subject !== 'all') {
        query.subject = subject
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
    const skip = (pageNum - 1) * limitNum

    const [reports, total] = await Promise.all([
      McqReport.find(query)
        .populate('mcqId')
        .populate('studentId', 'firstName lastName email profilePicture')
        .populate('resolvedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      McqReport.countDocuments(query),
    ])

    return res.status(200).json({
      success: true,
      reports,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      allowedSubjects: isAdmin ? ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning', 'Past Papers', 'FLPs'] : getTeacherSubjects(user),
    })
  } catch (error) {
    console.error('Error fetching teacher reports:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch reports' })
  }
}

// GET /api/reports/count - Get pending report counts
exports.getReportCount = async (req, res) => {
  try {
    const user = req.user
    const isAdmin = isUserAdmin(user)

    const query = { status: 'pending' }
    if (!isAdmin) {
      const allowedSubjects = getTeacherSubjects(user)
      if (allowedSubjects.length > 0) {
        query.subject = { $in: allowedSubjects }
      } else {
        return res.status(200).json({ success: true, pendingCount: 0 })
      }
    }

    const pendingCount = await McqReport.countDocuments(query)
    return res.status(200).json({ success: true, pendingCount })
  } catch (error) {
    console.error('Error getting report count:', error)
    return res.status(500).json({ error: error.message || 'Failed to get report count' })
  }
}

// PUT /api/reports/:reportId/resolve-and-edit - Teacher modifies MCQ and marks report resolved
exports.resolveAndEditReportedMcq = async (req, res) => {
  try {
    const { reportId } = req.params
    const {
      question,
      questionText,
      questionImages,
      options,
      explanation,
      explanationText,
      explanationImages,
      resolutionNotes,
      difficulty,
    } = req.body

    const report = await McqReport.findById(reportId)
    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    const isAdmin = isUserAdmin(req.user)
    if (!isAdmin && !canTeacherAccessSubject(req.user, report.subject)) {
      return res.status(403).json({ error: 'You are not authorized to manage reports for this subject' })
    }

    // Find the associated MCQ
    const mcq = await MCQ.findById(report.mcqId)
    if (!mcq) {
      return res.status(404).json({ error: 'Associated MCQ was not found in question bank' })
    }

    // Update MCQ fields
    if (question !== undefined || questionText !== undefined) {
      const finalQText = questionText !== undefined ? questionText : question
      mcq.question = finalQText || mcq.question
      mcq.questionText = finalQText || mcq.questionText
    }

    if (Array.isArray(questionImages)) {
      mcq.questionImages = questionImages
    }

    if (Array.isArray(options) && options.length >= 2) {
      // Validate at least one correct option
      const hasCorrect = options.some((opt) => opt.isCorrect === true)
      if (!hasCorrect) {
        return res.status(400).json({ error: 'At least one option must be marked as correct' })
      }
      mcq.options = options
      
      // Update option helper fields if needed
      if (options[0]) {
        mcq.optionA = options[0].text || ''
        mcq.optionAImages = options[0].images || []
      }
      if (options[1]) {
        mcq.optionB = options[1].text || ''
        mcq.optionBImages = options[1].images || []
      }
      if (options[2]) {
        mcq.optionC = options[2].text || ''
        mcq.optionCImages = options[2].images || []
      }
      if (options[3]) {
        mcq.optionD = options[3].text || ''
        mcq.optionDImages = options[3].images || []
      }

      const correctIndex = options.findIndex((opt) => opt.isCorrect)
      if (correctIndex >= 0) {
        mcq.correctAnswer = ['A', 'B', 'C', 'D'][correctIndex] || null
      }
    }

    if (explanation !== undefined || explanationText !== undefined) {
      const finalExp = explanationText !== undefined ? explanationText : explanation
      mcq.explanation = finalExp
      mcq.explanationText = finalExp
    }

    if (Array.isArray(explanationImages)) {
      mcq.explanationImages = explanationImages
    }

    if (difficulty) {
      mcq.difficulty = difficulty
    }

    mcq.needsReview = false
    await mcq.save()

    // Update report
    report.status = 'resolved'
    report.resolvedBy = req.user._id
    report.resolvedAt = new Date()
    report.resolutionNotes = resolutionNotes || 'MCQ successfully reviewed and updated in the question bank.'
    await report.save()

    return res.status(200).json({
      success: true,
      message: 'MCQ updated successfully in question bank and report marked as resolved.',
      report,
      mcq,
    })
  } catch (error) {
    console.error('Error resolving reported MCQ:', error)
    return res.status(500).json({ error: error.message || 'Failed to update MCQ' })
  }
}

// PUT /api/reports/:reportId/dismiss - Dismiss report without modifying MCQ
exports.dismissReport = async (req, res) => {
  try {
    const { reportId } = req.params
    const { resolutionNotes } = req.body

    const report = await McqReport.findById(reportId)
    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    const isAdmin = isUserAdmin(req.user)
    if (!isAdmin && !canTeacherAccessSubject(req.user, report.subject)) {
      return res.status(403).json({ error: 'You are not authorized to manage reports for this subject' })
    }

    report.status = 'dismissed'
    report.resolvedBy = req.user._id
    report.resolvedAt = new Date()
    report.resolutionNotes = resolutionNotes || 'Report dismissed after review (no changes needed).'
    await report.save()

    return res.status(200).json({
      success: true,
      message: 'Report dismissed.',
      report,
    })
  } catch (error) {
    console.error('Error dismissing report:', error)
    return res.status(500).json({ error: error.message || 'Failed to dismiss report' })
  }
}
