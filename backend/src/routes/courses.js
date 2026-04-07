const express = require('express')
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getEnrolledCourses,
  getMyCourses,
} = require('../controllers/courseController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Public routes
router.get('/', getAllCourses)

// Student routes
router.get('/student/enrolled-courses', protect, getEnrolledCourses)
router.post('/:courseId/enroll', protect, enrollInCourse)

// Teacher routes
router.get(
  '/teacher/my-courses',
  protect,
  authorize('teacher', 'admin'),
  getMyCourses,
)

// Public routes (with params) - keep after fixed paths
router.get('/:courseId', getCourseById)

// Protected routes
router.post('/', protect, authorize('teacher', 'admin'), createCourse)
router.put('/:courseId', protect, authorize('teacher', 'admin'), updateCourse)
router.delete(
  '/:courseId',
  protect,
  authorize('teacher', 'admin'),
  deleteCourse,
)

module.exports = router
