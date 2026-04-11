const Course = require('../models/Course')
const User = require('../models/User')

// ==================== CREATE COURSE (Teacher/Admin) ====================
exports.createCourse = async (req, res) => {
  try {
    const { name, description, category, topics, isPublished } = req.body

    if (!name || !description || !category) {
      return res
        .status(400)
        .json({ error: 'Please provide all required fields' })
    }

    const course = await Course.create({
      name,
      description,
      category,
      topics: topics || [],
      createdBy: req.user.id,
      isPublished: typeof isPublished === 'boolean' ? isPublished : false,
    })

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET ALL COURSES ====================
exports.getAllCourses = async (req, res) => {
  try {
    const filter = { isPublished: true }

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category
    }

    // Search by name
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' }
    }

    const courses = await Course.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .lean()
      .sort({ createdAt: -1 })

    const coursesWithCounts = courses.map((course) => ({
      ...course,
      enrolledCount: course.enrolledStudents
        ? course.enrolledStudents.length
        : 0,
      enrolledStudents: undefined,
    }))

    res.status(200).json({
      success: true,
      count: coursesWithCounts.length,
      courses: coursesWithCounts,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


// ==================== GET SINGLE COURSE ====================
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('createdBy', 'firstName lastName email')
      .populate('enrolledStudents', 'firstName lastName email')

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    res.status(200).json({
      success: true,
      course,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE COURSE ====================
exports.updateCourse = async (req, res) => {
  try {
    const { name, description, category, topics, isPublished } = req.body

    let course = await Course.findById(req.params.courseId)

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Check if user is creator or admin
    if (
      course.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this course' })
    }

    course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { name, description, category, topics, isPublished },
      { new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DELETE COURSE ====================
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Check if user is creator or admin
    if (
      course.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to delete this course' })
    }

    await Course.findByIdAndDelete(req.params.courseId)

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== ENROLL IN COURSE ====================
exports.enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Check if already enrolled
    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ error: 'Already enrolled in this course' })
    }

    course.enrolledStudents.push(req.user.id)
    await course.save()

    res.status(200).json({
      success: true,
      message: 'Enrolled in course successfully',
      course,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET ENROLLED COURSES ====================
exports.getEnrolledCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.user.id,
    }).populate('createdBy', 'firstName lastName email')

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET MY COURSES (Teacher) ====================
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user.id }).populate(
      'enrolledStudents',
      'firstName lastName email',
    )

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
