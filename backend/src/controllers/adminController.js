const User = require('../models/User')
const Course = require('../models/Course')

const normalizeString = (value) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeEmail = (value) => normalizeString(value).toLowerCase()

const isValidEmail = (value) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(value)
}

// ==================== CREATE USER (Admin/Superadmin) ====================
exports.createUser = async (req, res) => {
  try {
    const firstName = normalizeString(req.body.firstName)
    const lastName = normalizeString(req.body.lastName)
    const email = normalizeEmail(req.body.email)
    const password = req.body.password
    const roleInput = normalizeString(req.body.role)
    const role = roleInput ? roleInput.toLowerCase() : 'teacher'

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Please provide all required fields' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' })
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' })
    }

    if (role === 'student') {
      return res
        .status(400)
        .json({ error: 'Students must self-register.' })
    }

    const allowedRoles =
      req.user.role === 'superadmin'
        ? ['teacher', 'admin', 'superadmin']
        : ['teacher']

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Not authorized for this role' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      isEmailVerified: true,
      isActive: true,
    })

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET ALL USERS (Admin) ====================
exports.getAllUsers = async (req, res) => {
  try {
    const filter =
      req.user.role === 'superadmin'
        ? {}
        : { role: { $in: ['teacher', 'student'] } }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })

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
      if (role && role !== user.role) {
        return res
          .status(400)
          .json({ error: 'You cannot change your own role' })
      }
      if (typeof isActive === 'boolean' && isActive === false) {
        return res
          .status(400)
          .json({ error: 'You cannot deactivate your own account' })
      }
    }

    if (req.user.role !== 'superadmin') {
      if (user.role === 'superadmin') {
        return res
          .status(403)
          .json({ error: 'Only super admin can manage this user' })
      }
      if (user.role === 'admin') {
        return res
          .status(403)
          .json({ error: 'Only super admin can manage admins' })
      }
      if (role && (role === 'admin' || role === 'superadmin')) {
        return res
          .status(403)
          .json({ error: 'Only super admin can assign admin roles' })
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

    const target = await User.findById(req.params.userId)
    if (!target) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (req.user.role !== 'superadmin' && target.role === 'superadmin') {
      return res
        .status(403)
        .json({ error: 'Only super admin can manage this user' })
    }
    if (req.user.role !== 'superadmin' && target.role === 'admin') {
      return res
        .status(403)
        .json({ error: 'Only super admin can manage admins' })
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
