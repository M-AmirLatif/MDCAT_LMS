const express = require('express')
const {
  getNotifications,
  sendNotification,
  markAsRead,
  broadcastNotification,
  scheduleNotification,
} = require('../controllers/notificationController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

router.get('/', protect, getNotifications)
router.post('/', protect, authorize('teacher', 'admin'), sendNotification)
router.post('/mark-as-read', protect, markAsRead)
router.post('/broadcast', protect, authorize('teacher', 'admin'), broadcastNotification)
router.post('/schedule', protect, authorize('teacher', 'admin'), scheduleNotification)

module.exports = router
