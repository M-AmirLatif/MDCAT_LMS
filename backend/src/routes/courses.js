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
const { protect, protectWithPermissions, authorize } = require('../middlewares/auth')

const router = express.Router()

// Public routes
router.get('/', getAllCourses)

// Student routes
router.get('/student/enrolled-courses', protect, getEnrolledCourses)
router.post('/:courseId/enroll', protect, enrollInCourse)

// Teacher routes
router.get(
  '/teacher/my-courses',
  protectWithPermissions,
  authorize('manage_courses'),
  getMyCourses,
)

// Public routes (with params) - keep after fixed paths
router.get('/:courseId', getCourseById)

// Protected routes
router.post('/', protectWithPermissions, authorize('manage_courses'), createCourse)
router.put('/:courseId', protectWithPermissions, authorize('manage_courses'), updateCourse)
router.delete(
  '/:courseId',
  protectWithPermissions,
  authorize('manage_courses'),
  deleteCourse,
)

module.exports = router
