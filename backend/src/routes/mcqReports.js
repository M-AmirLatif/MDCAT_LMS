const express = require('express')
const {
  createReport,
  getTeacherReports,
  getReportCount,
  resolveAndEditReportedMcq,
  dismissReport,
} = require('../controllers/mcqReportController')
const { protect, optionalProtect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Student submits report
router.post('/mcq', optionalProtect, createReport)

// Teacher & Admin routes
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherReports)
router.get('/count', protect, authorize('teacher', 'admin'), getReportCount)
router.put('/:reportId/resolve-and-edit', protect, authorize('teacher', 'admin'), resolveAndEditReportedMcq)
router.put('/:reportId/dismiss', protect, authorize('teacher', 'admin'), dismissReport)

module.exports = router
