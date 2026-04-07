const express = require('express')
const { protect } = require('../middlewares/auth')
const {
  uploadSingleMiddleware,
  uploadSingle,
} = require('../controllers/uploadController')

const router = express.Router()

router.post('/single', protect, uploadSingleMiddleware, uploadSingle)

module.exports = router
