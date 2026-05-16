const Assignment = require('../models/Assignment')
const Course = require('../models/Course')

const isTeacherOrAdmin = (user) =>
  user?.role?.name === 'teacher' ||
  user?.role?.name === 'admin'

// ==================== CREATE ASSIGNMENT ====================
exports.createAssignment = async (req, res) => {
  try {
    const {
      courseId,
      title,
      description,
      instructions,
      attachments,
      dueDate,
      maxMarks,
    } = req.body

    if (!courseId || !title) {
      return res.status(400).json({
        error: 'Please provide courseId and title',
      })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    if (
      course.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to add assignments to this course' })
    }

    const assignment = await Assignment.create({
      courseId,
      title,
      description: description || '',
      instructions: instructions || '',
      attachments: Array.isArray(attachments) ? attachments : [],
      dueDate: dueDate || null,
      maxMarks: Number(maxMarks) || 100,
      createdBy: req.user.id,
    })

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET ASSIGNMENTS BY COURSE ====================
exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      courseId: req.params.courseId,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    const mapped = assignments.map((assignment) => {
      if (req.user.role?.name !== 'student') {
        return assignment
      }

      const submission = assignment.submissions.find(
        (s) => s.studentId.toString() === req.user.id,
      )

      return {
        ...assignment.toObject(),
        submissions: submission ? [submission] : [],
      }
    })

    res.status(200).json({
      success: true,
      count: mapped.length,
      assignments: mapped,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== SUBMIT ASSIGNMENT (Student) ====================
exports.submitAssignment = async (req, res) => {
  try {
    const { fileUrl, textAnswer } = req.body

    const assignment = await Assignment.findById(req.params.assignmentId)
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    const alreadySubmitted = assignment.submissions.some(
      (s) => s.studentId.toString() === req.user.id,
    )
    if (alreadySubmitted) {
      return res.status(400).json({ error: 'Assignment already submitted' })
    }

    assignment.submissions.push({
      studentId: req.user.id,
      fileUrl: fileUrl || null,
      textAnswer: textAnswer || null,
    })
    await assignment.save()

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET SUBMISSIONS (Teacher/Admin) ====================
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId)
      .populate('submissions.studentId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    if (
      assignment.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to view submissions' })
    }

    res.status(200).json({
      success: true,
      assignment,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GRADE SUBMISSION (Teacher/Admin) ====================
exports.gradeSubmission = async (req, res) => {
  try {
    const { studentId, marks, feedback } = req.body

    const assignment = await Assignment.findById(req.params.assignmentId)
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    if (
      assignment.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to grade submissions' })
    }

    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === String(studentId),
    )

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    submission.marks = Number(marks) || 0
    submission.feedback = feedback || ''
    submission.gradedAt = new Date()
    submission.gradedBy = req.user.id

    await assignment.save()

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
