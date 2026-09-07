const express = require('express')
const {
  toggleFlashcard,
  getDueFlashcards,
  reviewFlashcard,
  getFlashcardStats,
  getSavedStatus
} = require('../controllers/flashcardController')
const { protect } = require('../middlewares/auth')

const router = express.Router()

router.use(protect)

router.post('/toggle', toggleFlashcard)
router.get('/due', getDueFlashcards)
router.get('/stats', getFlashcardStats)
router.post('/status', getSavedStatus)
router.put('/:id/review', reviewFlashcard)

module.exports = router
