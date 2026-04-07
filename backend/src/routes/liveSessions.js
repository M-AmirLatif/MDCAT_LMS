const express = require('express')
const {
  createLiveSession,
  getLiveSessions,
  endLiveSession,
} = require('../controllers/liveSessionController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

router.get('/', protect, getLiveSessions)
router.post('/', protect, authorize('teacher', 'admin'), createLiveSession)
router.put('/:sessionId/end', protect, authorize('teacher', 'admin'), endLiveSession)

module.exports = router
