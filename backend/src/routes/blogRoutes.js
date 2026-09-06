const express = require('express')
const { getBlogs, getBlog, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController')
const { protect, authorize } = require('../middlewares/auth')

const router = express.Router()

// Public routes (with optional auth for admin previews)
router.route('/').get(getBlogs)
router.route('/:slug').get(getBlog)

// Admin only routes
router.use(protect)
router.use(authorize('admin'))

router.route('/').post(createBlog)
router.route('/:id').put(updateBlog).delete(deleteBlog)

module.exports = router

