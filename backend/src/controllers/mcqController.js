const MCQ = require('../models/MCQ')
const Course = require('../models/Course')

const hasCorrectOption = (options) => {
  return Array.isArray(options) && options.some((opt) => opt.isCorrect === true)
}

// ==================== CREATE MCQ (Teacher/Admin) ====================
exports.createMcq = async (req, res) => {
  try {
    const {
      courseId,
      topic,
      subject,
      chapterId,
      chapterName,
      question,
      options,
      explanation,
      difficulty,
      year,
      isPastPaper,
      isPublished,
    } = req.body

    if (!courseId || !topic || !question || !options) {
      return res
        .status(400)
        .json({ error: 'Please provide all required fields' })
    }

    if (!hasCorrectOption(options)) {
      return res
        .status(400)
        .json({ error: 'At least one option must be correct' })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    if (
      course.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin' &&
      req.user.role?.name !== 'superadmin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to add MCQs to this course' })
    }

    const mcq = await MCQ.create({
      courseId,
      topic,
      question,
      options,
      explanation: explanation || null,
      subject: subject || course.category,
      chapterId: chapterId || null,
      chapterName: chapterName || topic,
      difficulty: difficulty || 'medium',
      year: year || null,
      isPastPaper: isPastPaper || false,
      createdBy: req.user.id,
      isPublished: typeof isPublished === 'boolean' ? isPublished : false,
      correctAnswer:
        ['A', 'B', 'C', 'D'][options.findIndex((option) => option.isCorrect)] || null,
    })

    res.status(201).json({
      success: true,
      message: 'MCQ created successfully',
      mcq,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const stripCorrectOptions = (mcqs) => {
  return mcqs.map((mcq) => ({
    ...mcq,
    options: mcq.options?.map((opt) => ({ text: opt.text })) || [],
  }))
}

// ==================== GET MCQS BY COURSE (Student-safe) ====================
exports.getMcqsByCourse = async (req, res) => {
  try {
    const filter = {
      courseId: req.params.courseId,
      isPublished: true,
    }

    // Optional topic filter
    if (req.query.topic) {
      filter.topic = req.query.topic
    }

    // Optional difficulty filter
    if (req.query.difficulty) {
      filter.difficulty = req.query.difficulty
    }

    // Optional past paper filter
    if (req.query.isPastPaper === 'true') {
      filter.isPastPaper = true
    }
    if (req.query.year) {
      filter.year = Number(req.query.year)
    }

    // Randomize option
    const limit = parseInt(req.query.limit, 10) || 0

    let query = MCQ.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .lean()

    if (limit > 0) {
      // Return random questions for mock tests
      const mcqs = await MCQ.aggregate([
        { $match: filter },
        { $sample: { size: limit } },
      ])
      const safeMcqs = stripCorrectOptions(mcqs)
      return res.status(200).json({
        success: true,
        count: safeMcqs.length,
        mcqs: safeMcqs,
      })
    }

    const mcqs = await query.sort({ createdAt: -1 })
    const safeMcqs = stripCorrectOptions(mcqs)

    res.status(200).json({
      success: true,
      count: safeMcqs.length,
      mcqs: safeMcqs,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET TOPICS FOR COURSE ====================
exports.getTopicsByCourse = async (req, res) => {
  try {
    const topics = await MCQ.distinct('topic', {
      courseId: req.params.courseId,
      isPublished: true,
    })

    res.status(200).json({
      success: true,
      topics,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET MCQS BY COURSE (Teacher/Admin) ====================
exports.getMcqsByCourseFull = async (req, res) => {
  try {
    const mcqs = await MCQ.find({
      courseId: req.params.courseId,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: mcqs.length,
      mcqs,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE MCQ ====================
exports.updateMcq = async (req, res) => {
  try {
    const {
      topic,
      subject,
      chapterId,
      chapterName,
      question,
      options,
      explanation,
      difficulty,
      year,
      isPastPaper,
      isPublished,
    } = req.body

    let mcq = await MCQ.findById(req.params.mcqId)

    if (!mcq) {
      return res.status(404).json({ error: 'MCQ not found' })
    }

    if (
      mcq.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin' &&
      req.user.role?.name !== 'superadmin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this MCQ' })
    }

    if (options && !hasCorrectOption(options)) {
      return res
        .status(400)
        .json({ error: 'At least one option must be correct' })
    }

    mcq = await MCQ.findByIdAndUpdate(
      req.params.mcqId,
      {
        topic,
        subject,
        chapterId,
        chapterName,
        question,
        options,
        explanation,
        difficulty,
        year,
        isPastPaper,
        isPublished,
        correctAnswer: options ? ['A', 'B', 'C', 'D'][options.findIndex((option) => option.isCorrect)] || null : mcq.correctAnswer,
      },
      { new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      message: 'MCQ updated successfully',
      mcq,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DELETE MCQ ====================
exports.deleteMcq = async (req, res) => {
  try {
    const mcq = await MCQ.findById(req.params.mcqId)

    if (!mcq) {
      return res.status(404).json({ error: 'MCQ not found' })
    }

    if (
      mcq.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin' &&
      req.user.role?.name !== 'superadmin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to delete this MCQ' })
    }

    await MCQ.findByIdAndDelete(req.params.mcqId)

    res.status(200).json({
      success: true,
      message: 'MCQ deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
