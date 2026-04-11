const express = require('express')
const {
  createMcq,
  getMcqsByCourse,
  getMcqsByCourseFull,
  getTopicsByCourse,
  updateMcq,
  deleteMcq,
} = require('../controllers/mcqController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Public routes
router.get('/course/:courseId', getMcqsByCourse)
router.get('/course/:courseId/topics', getTopicsByCourse)

// Teacher/Admin routes (full answers)
router.get(
  '/course/:courseId/full',
  protect,
  authorize('teacher', 'admin'),
  getMcqsByCourseFull,
)

// Protected routes (Teacher/Admin only)
router.post('/', protect, authorize('teacher', 'admin'), createMcq)
router.put('/:mcqId', protect, authorize('teacher', 'admin'), updateMcq)
router.delete('/:mcqId', protect, authorize('teacher', 'admin'), deleteMcq)

module.exports = router
