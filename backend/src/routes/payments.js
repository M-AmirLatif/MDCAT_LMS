const express = require('express')
const {
  createPayment,
  getMyPayments,
  updatePaymentStatus,
} = require('../controllers/paymentController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

router.post('/', protect, authorize('student', 'teacher', 'admin'), createPayment)
router.get('/my', protect, authorize('student', 'teacher', 'admin'), getMyPayments)
router.put('/:paymentId', protect, authorize('admin'), updatePaymentStatus)

module.exports = router
