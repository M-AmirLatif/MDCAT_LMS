const express = require('express')
const {
  createAssignment,
  getAssignmentsByCourse,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
} = require('../controllers/assignmentController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Get assignments by course (students/teachers)
router.get('/course/:courseId', protect, getAssignmentsByCourse)

// Create assignment (teacher/admin)
router.post('/', protect, authorize('teacher', 'admin'), createAssignment)

// Submit assignment (student)
router.post(
  '/:assignmentId/submit',
  protect,
  authorize('student', 'teacher', 'admin'),
  submitAssignment,
)

// Submissions & grading (teacher/admin)
router.get(
  '/:assignmentId/submissions',
  protect,
  authorize('teacher', 'admin'),
  getAssignmentSubmissions,
)
router.put(
  '/:assignmentId/grade',
  protect,
  authorize('teacher', 'admin'),
  gradeSubmission,
)

module.exports = router
