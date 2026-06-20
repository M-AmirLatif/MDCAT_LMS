const express = require('express')
const {
  getPaymentMethods,
  submitPaymentRequest,
  getMyPaymentRequests,
  uploadPaymentScreenshot,
} = require('../controllers/paymentController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

router.get('/methods', protect, authorize('student'), getPaymentMethods)
router.post('/submit', protect, authorize('student'), uploadPaymentScreenshot, submitPaymentRequest)
router.get('/my-requests', protect, authorize('student'), getMyPaymentRequests)

// Back-compatible aliases for the old frontend route names.
router.post('/', protect, authorize('student'), uploadPaymentScreenshot, submitPaymentRequest)
router.get('/my', protect, authorize('student'), getMyPaymentRequests)

module.exports = router
