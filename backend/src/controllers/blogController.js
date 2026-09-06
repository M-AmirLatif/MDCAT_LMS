const Blog = require('../models/Blog')

exports.getBlogs = async (req, res, next) => {
  try {
    const query = { isPublished: true }
    if (req.user?.role === 'admin') {
      delete query.isPublished
    }
    const blogs = await Blog.find(query).sort('-publishedAt -createdAt').populate('author', 'firstName lastName')
    res.status(200).json({ success: true, count: blogs.length, data: blogs })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}

exports.getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'firstName lastName')
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' })
    if (!blog.isPublished && req.user?.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Blog not found' })
    }
    res.status(200).json({ success: true, data: blog })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}

exports.createBlog = async (req, res, next) => {
  try {
    req.body.author = req.user.id
    if (req.body.isPublished) req.body.publishedAt = Date.now()
    const blog = await Blog.create(req.body)
    res.status(201).json({ success: true, data: blog })
  } catch (error) {
    console.error(error)
    res.status(400).json({ success: false, message: error.message })
  }
}

exports.updateBlog = async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' })
    
    if (req.body.isPublished && !blog.isPublished) {
      req.body.publishedAt = Date.now()
    } else if (req.body.isPublished === false) {
      req.body.publishedAt = null
    }

    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.status(200).json({ success: true, data: blog })
  } catch (error) {
    console.error(error)
    res.status(400).json({ success: false, message: error.message })
  }
}

exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' })
    await blog.deleteOne()
    res.status(200).json({ success: true, data: {} })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Server Error' })
  }
}

