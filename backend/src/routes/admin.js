const express = require('express')
const {
  createUser,
  getAllUsers,
  updateUser,
  deactivateUser,
  getAllCoursesAdmin,
} = require('../controllers/adminController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

router.use(protect, authorize('manage_users'))

// Users
router.get('/users', getAllUsers)
router.post('/users', createUser)
router.put('/users/:userId', updateUser)
router.delete('/users/:userId', deactivateUser)

// Courses
router.get('/courses', getAllCoursesAdmin)

module.exports = router
