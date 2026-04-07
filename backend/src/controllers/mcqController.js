const MCQ = require('../models/MCQ')
const Course = require('../models/Course')

const hasCorrectOption = (options) => {
  return Array.isArray(options) && options.some((opt) => opt.isCorrect === true)
}

// ==================== CREATE MCQ (Teacher/Admin) ====================
exports.createMcq = async (req, res) => {
  try {
    const { courseId, topic, question, options, explanation, isPublished } =
      req.body

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

    if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
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
      createdBy: req.user.id,
      isPublished: typeof isPublished === 'boolean' ? isPublished : false,
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
    const mcqs = await MCQ.find({
      courseId: req.params.courseId,
      isPublished: true,
    })
      .populate('createdBy', 'firstName lastName email')
      .lean()
      .sort({ createdAt: -1 })

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
    const { topic, question, options, explanation, isPublished } = req.body

    let mcq = await MCQ.findById(req.params.mcqId)

    if (!mcq) {
      return res.status(404).json({ error: 'MCQ not found' })
    }

    if (mcq.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
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
      { topic, question, options, explanation, isPublished },
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

    if (mcq.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
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
