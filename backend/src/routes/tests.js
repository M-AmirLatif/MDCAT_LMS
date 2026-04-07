const express = require('express')
const {
  submitTest,
  getMyTestHistory,
  getMyTestSummary,
} = require('../controllers/testController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Student routes
router.post('/submit', protect, authorize('student', 'teacher', 'admin'), submitTest)
router.get('/my', protect, authorize('student', 'teacher', 'admin'), getMyTestHistory)
router.get('/summary', protect, authorize('student', 'teacher', 'admin'), getMyTestSummary)

module.exports = router
