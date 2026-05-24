const express = require('express')
const {
  createMcq,
  getMcqsByCourse,
  getMcqsByCourseFull,
  getTopicsByCourse,
  updateMcq,
  deleteMcq,
  getSubjectSummary,
  getChaptersBySubject,
  createChapter,
  updateChapter,
  deleteChapter,
  createTopic,
  updateTopic,
  deleteTopic,
  deleteCsvReviewItem,
  updateCsvReviewItem,
  getMcqsByChapter,
  createChapterMcq,
  uploadChapterMcqsCsv,
  submitChapterAttempt,
} = require('../controllers/mcqController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Public routes
router.get('/course/:courseId', getMcqsByCourse)
router.get('/course/:courseId/topics', getTopicsByCourse)

// MDCAT subject hierarchy routes
router.get('/subjects/summary', protect, getSubjectSummary)
router.get('/:subject/chapters', protect, getChaptersBySubject)
router.post('/:subject/chapters', protect, authorize('teacher', 'admin'), createChapter)
router.put('/:subject/chapters/:chapterId', protect, authorize('teacher', 'admin'), updateChapter)
router.delete('/:subject/chapters/:chapterId', protect, authorize('teacher', 'admin'), deleteChapter)
router.post('/:subject/chapters/:chapterId/topics', protect, authorize('teacher', 'admin'), createTopic)
router.put('/:subject/chapters/:chapterId/topics/:topicId', protect, authorize('teacher', 'admin'), updateTopic)
router.delete('/:subject/chapters/:chapterId/topics/:topicId', protect, authorize('teacher', 'admin'), deleteTopic)
router.delete('/:subject/chapters/:chapterId/review-queue/:itemId', protect, authorize('teacher', 'admin'), deleteCsvReviewItem)
router.put('/:subject/chapters/:chapterId/review-queue/:itemId', protect, authorize('teacher', 'admin'), updateCsvReviewItem)
router.get('/:subject/:chapterId', protect, getMcqsByChapter)
router.post('/:subject/:chapterId', protect, authorize('teacher', 'admin'), createChapterMcq)
router.post('/:subject/:chapterId/upload-csv', protect, authorize('teacher', 'admin'), uploadChapterMcqsCsv)
router.post('/:subject/:chapterId/submit', protect, submitChapterAttempt)

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
