const Blog = require('../models/Blog')
const { catchAsync } = require('../utils/catchAsync')
const ErrorResponse = require('../utils/errorResponse')

exports.getBlogs = catchAsync(async (req, res, next) => {
  const query = { isPublished: true }
  if (req.user?.role === 'admin') {
    delete query.isPublished // Admins can see all
  }
  const blogs = await Blog.find(query).sort('-publishedAt -createdAt').populate('author', 'firstName lastName')
  res.status(200).json({ success: true, count: blogs.length, data: blogs })
})

exports.getBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'firstName lastName')
  if (!blog) return next(new ErrorResponse('Blog not found', 404))
  if (!blog.isPublished && req.user?.role !== 'admin') {
    return next(new ErrorResponse('Blog not found', 404))
  }
  res.status(200).json({ success: true, data: blog })
})

exports.createBlog = catchAsync(async (req, res, next) => {
  req.body.author = req.user.id
  if (req.body.isPublished) req.body.publishedAt = Date.now()
  const blog = await Blog.create(req.body)
  res.status(201).json({ success: true, data: blog })
})

exports.updateBlog = catchAsync(async (req, res, next) => {
  let blog = await Blog.findById(req.params.id)
  if (!blog) return next(new ErrorResponse('Blog not found', 404))
  
  if (req.body.isPublished && !blog.isPublished) {
    req.body.publishedAt = Date.now()
  } else if (req.body.isPublished === false) {
    req.body.publishedAt = null
  }

  blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  res.status(200).json({ success: true, data: blog })
})

exports.deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id)
  if (!blog) return next(new ErrorResponse('Blog not found', 404))
  await blog.deleteOne()
  res.status(200).json({ success: true, data: {} })
})

