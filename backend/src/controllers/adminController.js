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

    const requesterRole = req.user.role?.name

    const allowedRoles =
      requesterRole === 'superadmin'
        ? ['teacher', 'admin', 'superadmin']
        : ['teacher']

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
        role: roleDoc.name,
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
    const requesterRole = req.user.role?.name

    let filter = {}
    if (requesterRole !== 'superadmin') {
      const [teacherRole, studentRole] = await Promise.all([
        Role.findOne({ name: 'teacher' }).lean(),
        Role.findOne({ name: 'student' }).lean(),
      ])
      filter = {
        role: {
          $in: [teacherRole?._id, studentRole?._id].filter(Boolean),
        },
      }
    }

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
      users,
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

    const requesterRole = req.user.role?.name

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

    const targetRole = user.role?.name

    if (requesterRole !== 'superadmin') {
      if (targetRole === 'superadmin') {
        return res
          .status(403)
          .json({ error: 'Only super admin can manage this user' })
      }
      if (targetRole === 'admin') {
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
      const roleDoc = await Role.findOne({ name: String(role).toLowerCase() })
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
      user: updated,
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

    const requesterRole = req.user.role?.name

    const target = await User.findById(req.params.userId).populate('role', 'name')
    if (!target) {
      return res.status(404).json({ error: 'User not found' })
    }

    const targetRole = target.role?.name

    if (requesterRole !== 'superadmin' && targetRole === 'superadmin') {
      return res
        .status(403)
        .json({ error: 'Only super admin can manage this user' })
    }
    if (requesterRole !== 'superadmin' && targetRole === 'admin') {
      return res
        .status(403)
        .json({ error: 'Only super admin can manage admins' })
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
