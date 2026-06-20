const express = require('express')
const { getMySubscriptions } = require('../controllers/paymentController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

router.get('/my-subscriptions', protect, authorize('student'), getMySubscriptions)

module.exports = router
