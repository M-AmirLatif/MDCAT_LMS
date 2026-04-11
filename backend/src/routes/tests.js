const express = require('express')
const {
  submitTest,
  getMyTestHistory,
  getMyTestSummary,
  getTestDetail,
  getSubjectWisePerformance,
} = require('../controllers/testController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Student routes
router.post('/submit', protect, authorize('student', 'teacher', 'admin'), submitTest)
router.get('/my', protect, authorize('student', 'teacher', 'admin'), getMyTestHistory)
router.get('/summary', protect, authorize('student', 'teacher', 'admin'), getMyTestSummary)
router.get('/subjects', protect, authorize('student', 'teacher', 'admin'), getSubjectWisePerformance)
router.get('/:sessionId', protect, authorize('student', 'teacher', 'admin'), getTestDetail)

module.exports = router
