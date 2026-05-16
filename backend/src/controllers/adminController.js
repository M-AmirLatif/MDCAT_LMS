const User = require('../models/User')
const Course = require('../models/Course')
const Role = require('../models/Role')

const normalizeString = (value) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeEmail = (value) => normalizeString(value).toLowerCase()

const isValidEmail = (value) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(value)
}

const normalizeRoleName = (value) =>
  String(value || '').toLowerCase() === 'superadmin' ? 'admin' : String(value || '').toLowerCase()

// ==================== CREATE USER (Admin/Superadmin) ====================
exports.createUser = async (req, res) => {
  try {
    const firstName = normalizeString(req.body.firstName)
    const lastName = normalizeString(req.body.lastName)
    const email = normalizeEmail(req.body.email)
    const password = req.body.password
    const roleInput = normalizeString(req.body.role)
    const role = roleInput ? normalizeRoleName(roleInput) : 'teacher'

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

    const requesterRole = normalizeRoleName(req.user.role?.name)
    const allowedRoles = ['teacher', 'admin']

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Not authorized for this role' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    const roleDoc = await Role.findOne({ name: role })
    if (!roleDoc) {
      return res.status(500).json({ error: 'Role not configured in the system' })
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: roleDoc._id,
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
        role: normalizeRoleName(roleDoc.name),
        roleId: roleDoc._id,
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
    let filter = {}

    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('role', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        ...user,
        role: normalizeRoleName(user.role?.name),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE USER (Admin) ====================
exports.updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body
    const requesterRole = normalizeRoleName(req.user.role?.name)

    const user = await User.findById(req.params.userId).populate('role', 'name')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (String(user._id) === String(req.user.id)) {
      if (role && String(role).toLowerCase() !== user.role?.name) {
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

    const targetRole = normalizeRoleName(user.role?.name)

    if (role) {
      const roleDoc = await Role.findOne({ name: normalizeRoleName(role) })
      if (!roleDoc) {
        return res.status(400).json({ error: 'Invalid role' })
      }
      user.role = roleDoc._id
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive
    }

    await user.save()

    const updated = await User.findById(user._id)
      .select('-password')
      .populate('role', 'name')

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...updated.toObject(),
        role: normalizeRoleName(updated.role?.name),
      },
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

    const target = await User.findById(req.params.userId).populate('role', 'name')
    if (!target) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true },
    )
      .select('-password')
      .populate('role', 'name')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user: {
        ...user.toObject(),
        role: normalizeRoleName(user.role?.name),
      },
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
