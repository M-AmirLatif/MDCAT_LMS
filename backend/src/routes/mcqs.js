const express = require('express')
const multer = require('multer')
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
  getCsvReviewQueue,
  approveCsvReviewItem,
  getMcqsByChapter,
  createChapterMcq,
  uploadChapterMcqsCsv,
  getLatestChapterAttempt,
  submitChapterAttempt,
  getTeacherAnalytics,
  getPublicPaperKey,
} = require('../controllers/mcqController')
const { protect, optionalProtect, authorize } = require('../middlewares/auth')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Public routes
router.get('/course/:courseId', getMcqsByCourse)
router.get('/course/:courseId/topics', getTopicsByCourse)
router.get('/public/paper-key/:chapterId', getPublicPaperKey)

// MDCAT subject hierarchy routes
router.get('/subjects/summary', optionalProtect, getSubjectSummary)
router.get('/:subject/chapters', optionalProtect, getChaptersBySubject)
router.post('/:subject/chapters', protect, authorize('teacher', 'admin'), createChapter)
router.put('/:subject/chapters/:chapterId', protect, authorize('teacher', 'admin'), updateChapter)
router.delete('/:subject/chapters/:chapterId', protect, authorize('teacher', 'admin'), deleteChapter)
router.post('/:subject/chapters/:chapterId/topics', protect, authorize('teacher', 'admin'), createTopic)
router.put('/:subject/chapters/:chapterId/topics/:topicId', protect, authorize('teacher', 'admin'), updateTopic)
router.delete('/:subject/chapters/:chapterId/topics/:topicId', protect, authorize('teacher', 'admin'), deleteTopic)
router.get('/:subject/chapters/:chapterId/review-queue', protect, authorize('teacher', 'admin'), getCsvReviewQueue)
router.delete('/:subject/chapters/:chapterId/review-queue/:itemId', protect, authorize('teacher', 'admin'), deleteCsvReviewItem)
router.put('/:subject/chapters/:chapterId/review-queue/:itemId', protect, authorize('teacher', 'admin'), updateCsvReviewItem)
router.post('/:subject/chapters/:chapterId/review-queue/:itemId/approve', protect, authorize('teacher', 'admin'), approveCsvReviewItem)
router.get('/:subject/:chapterId', optionalProtect, getMcqsByChapter)
router.post('/:subject/:chapterId', protect, authorize('teacher', 'admin'), createChapterMcq)
router.post('/:subject/:chapterId/upload-csv', protect, authorize('teacher', 'admin'), upload.single('file'), uploadChapterMcqsCsv)
router.get('/:subject/:chapterId/latest-attempt', optionalProtect, getLatestChapterAttempt)
router.post('/:subject/:chapterId/submit', optionalProtect, submitChapterAttempt)

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

router.get('/teacher/analytics', protect, authorize('teacher', 'admin'), getTeacherAnalytics)

module.exports = router


