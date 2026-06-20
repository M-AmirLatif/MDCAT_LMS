const express = require('express')
const {
  createUser,
  getAllUsers,
  updateUser,
  deactivateUser,
  getAllCoursesAdmin,
  getAdminOverview,
} = require('../controllers/adminController')
const {
  getPendingPaymentRequests,
  getAllPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} = require('../controllers/paymentController')
const { protectWithPermissions, authorize } = require('../middlewares/auth')

const router = express.Router()

router.use(protectWithPermissions, authorize('manage_users'))

// Users
router.get('/overview', getAdminOverview)
router.get('/payments/pending', getPendingPaymentRequests)
router.get('/payments/all', getAllPaymentRequests)
router.patch('/payments/:id/approve', approvePaymentRequest)
router.patch('/payments/:id/reject', rejectPaymentRequest)
router.get('/users', getAllUsers)
router.post('/users', createUser)
router.put('/users/:userId', updateUser)
router.delete('/users/:userId', deactivateUser)

// Courses
router.get('/courses', getAllCoursesAdmin)

module.exports = router
