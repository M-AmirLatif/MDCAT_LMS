const express = require('express')
const {
  getAllUsers,
  updateUser,
  deactivateUser,
  getAllCoursesAdmin,
} = require('../controllers/adminController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

router.use(protect, authorize('admin'))

// Users
router.get('/users', getAllUsers)
router.put('/users/:userId', updateUser)
router.delete('/users/:userId', deactivateUser)

// Courses
router.get('/courses', getAllCoursesAdmin)

module.exports = router
