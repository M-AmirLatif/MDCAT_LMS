const express = require('express')
const {
  createLecture,
  getLecturesByCourse,
  getLectureById,
  updateLecture,
  deleteLecture,
} = require('../controllers/lectureController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Public routes
router.get('/course/:courseId', getLecturesByCourse)
router.get('/:lectureId', getLectureById)

// Protected routes (Teacher/Admin only)
router.post('/', protect, authorize('teacher', 'admin'), createLecture)
router.put('/:lectureId', protect, authorize('teacher', 'admin'), updateLecture)
router.delete(
  '/:lectureId',
  protect,
  authorize('teacher', 'admin'),
  deleteLecture,
)

module.exports = router
