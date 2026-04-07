const User = require('../models/User')
const Course = require('../models/Course')

// ==================== GET ALL USERS (Admin) ====================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE USER (Admin) ====================
exports.updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body

    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (String(user._id) === String(req.user.id)) {
      if (role && role !== 'admin') {
        return res
          .status(400)
          .json({ error: 'You cannot remove your own admin role' })
      }
      if (typeof isActive === 'boolean' && isActive === false) {
        return res
          .status(400)
          .json({ error: 'You cannot deactivate your own account' })
      }
    }

    if (role) {
      user.role = role
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive
    }

    await user.save()

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DEACTIVATE USER (Admin) ====================
exports.deactivateUser = async (req, res) => {
  try {
    if (String(req.params.userId) === String(req.user.id)) {
      return res
        .status(400)
        .json({ error: 'You cannot deactivate your own account' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true },
    ).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET ALL COURSES (Admin) ====================
exports.getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find()
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
