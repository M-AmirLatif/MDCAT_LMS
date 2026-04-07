const express = require('express')
const {
  register,
  login,
  getProfile,
  updateProfile,
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

// Protected routes
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)

module.exports = router
