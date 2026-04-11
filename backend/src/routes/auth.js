const express = require('express')
const {
  register,
  login,
  verifyEmail,
  resendOtp,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController')
const { protect } = require('../middlewares/auth')
const { createRateLimiter } = require('../middlewares/rateLimiter')

const router = express.Router()
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
})

// Public routes
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/verify-email', authLimiter, verifyEmail)
router.post('/resend-otp', authLimiter, resendOtp)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)

// Protected routes
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)

module.exports = router
