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
  googleLogin,
  setPassword,
} = require('../controllers/authController')
const { protect } = require('../middlewares/auth')
const { createRateLimiter } = require('../middlewares/rateLimiter')

const router = express.Router()

// Credential-guessing protection: keyed per email address, so one student's
// retries never lock out anyone else.
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
})

// Google sign-in is not a guessable-secret endpoint — the ID token is verified
// against Google's keys. A tight limit here only ever hurts real users, and
// because the body carries no email it previously throttled every student in the
// system through one shared bucket. Keyed per Google account now.
const googleLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 60,
})

// Second, deliberately generous layer keyed on IP. This bounds credential
// stuffing across many different accounts from one source without ever
// collectively locking out students who share Hostinger's proxy IP.
const authIpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  scope: 'ip',
  maxRequests: 150,
  sharedIpMaxRequests: 1500,
})

// Public routes
router.post('/register', authIpLimiter, authLimiter, register)
router.post('/login', authIpLimiter, authLimiter, login)
router.post('/verify-email', authLimiter, verifyEmail)
router.post('/resend-otp', authLimiter, resendOtp)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)
router.post('/google', googleLimiter, googleLogin)

// Protected routes
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.post('/set-password', protect, setPassword)

module.exports = router
