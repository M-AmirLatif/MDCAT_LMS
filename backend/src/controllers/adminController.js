const User = require('../models/User')
const Course = require('../models/Course')
const Role = require('../models/Role')
const Payment = require('../models/Payment')
const TestSession = require('../models/TestSession')
const MCQ = require('../models/MCQ')

const normalizeString = (value) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeEmail = (value) => normalizeString(value).toLowerCase()

const isValidEmail = (value) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(value)
}

const normalizeRoleName = (value) =>
  String(value || '').toLowerCase() === 'superadmin' ? 'admin' : String(value || '').toLowerCase()

const VALID_SUBSCRIPTION_PLANS = ['free', 'monthly', 'quarterly', 'premium', 'enterprise']
const VALID_SUBSCRIPTION_STATUSES = ['none', 'pending', 'active', 'expired', 'cancelled']
const VALID_ACCESS_STATUSES = ['active', 'restricted', 'expired']

const normalizeEnumValue = (value, allowedValues) => {
  const normalized = String(value || '').trim().toLowerCase()
  return allowedValues.includes(normalized) ? normalized : ''
}

const parseOptionalDate = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'invalid' : parsed
}

const buildUserMetrics = async (userIds) => {
  if (!userIds.length) return new Map()

  const [testMetrics, paymentMetrics] = await Promise.all([
    TestSession.aggregate([
      { $match: { studentId: { $in: userIds } } },
      {
        $group: {
          _id: '$studentId',
          totalTests: { $sum: 1 },
          lastAttemptAt: { $max: '$submittedAt' },
          averageScore: { $avg: '$percentage' },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { studentId: { $in: userIds } } },
      {
        $group: {
          _id: '$studentId',
          totalPayments: { $sum: 1 },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalPaidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
          },
          latestPaymentStatus: { $last: '$status' },
        },
      },
    ]),
  ])

  const metrics = new Map()
  testMetrics.forEach((item) => {
    metrics.set(String(item._id), {
      totalTests: item.totalTests || 0,
      lastAttemptAt: item.lastAttemptAt || null,
      averageScore: Math.round(item.averageScore || 0),
    })
  })

  paymentMetrics.forEach((item) => {
    const current = metrics.get(String(item._id)) || {
      totalTests: 0,
      lastAttemptAt: null,
      averageScore: 0,
    }
    metrics.set(String(item._id), {
      ...current,
      totalPayments: item.totalPayments || 0,
      completedPayments: item.completedPayments || 0,
      totalPaidAmount: item.totalPaidAmount || 0,
      latestPaymentStatus: item.latestPaymentStatus || 'none',
    })
  })

  return metrics
}

const serializeUser = (user, metrics = {}) => ({
  ...user,
  role: normalizeRoleName(user.role?.name),
  subscriptionPlan: user.subscriptionPlan || 'free',
  subscriptionStatus: user.subscriptionStatus || 'none',
  subscriptionStartDate: user.subscriptionStartDate || null,
  subscriptionEndDate: user.subscriptionEndDate || null,
  accessStatus: user.accessStatus || 'active',
  metrics: {
    totalTests: metrics.totalTests || 0,
    lastAttemptAt: metrics.lastAttemptAt || null,
    averageScore: metrics.averageScore || 0,
    totalPayments: metrics.totalPayments || 0,
    completedPayments: metrics.completedPayments || 0,
    totalPaidAmount: metrics.totalPaidAmount || 0,
    latestPaymentStatus: metrics.latestPaymentStatus || 'none',
  },
})

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
    const filter = {}
    const search = normalizeString(req.query.search)
    const requestedRole = normalizeRoleName(req.query.role)

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    if (requestedRole) {
      const roleDoc = await Role.findOne({ name: requestedRole }).select('_id')
      if (!roleDoc) {
        return res.status(200).json({
          success: true,
          count: 0,
          users: [],
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        })
      }
      filter.role = roleDoc._id
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

    const userMetrics = await buildUserMetrics(users.map((user) => user._id))

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) => serializeUser(user, userMetrics.get(String(user._id)))),
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
    const {
      role,
      isActive,
      subscriptionPlan,
      subscriptionStatus,
      subscriptionStartDate,
      subscriptionEndDate,
      accessStatus,
    } = req.body

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

    if (role) {
      const roleDoc = await Role.findOne({ name: normalizeRoleName(role) })
      if (!roleDoc) {
        return res.status(400).json({ error: 'Invalid role' })
      }
      user.role = roleDoc._id
    }

    if (typeof subscriptionPlan !== 'undefined') {
      const normalizedPlan = normalizeEnumValue(subscriptionPlan, VALID_SUBSCRIPTION_PLANS)
      if (!normalizedPlan) {
        return res.status(400).json({ error: 'Invalid subscription plan' })
      }
      user.subscriptionPlan = normalizedPlan
    }

    if (typeof subscriptionStatus !== 'undefined') {
      const normalizedStatus = normalizeEnumValue(subscriptionStatus, VALID_SUBSCRIPTION_STATUSES)
      if (!normalizedStatus) {
        return res.status(400).json({ error: 'Invalid subscription status' })
      }
      user.subscriptionStatus = normalizedStatus
    }

    if (typeof accessStatus !== 'undefined') {
      const normalizedAccessStatus = normalizeEnumValue(accessStatus, VALID_ACCESS_STATUSES)
      if (!normalizedAccessStatus) {
        return res.status(400).json({ error: 'Invalid access status' })
      }
      user.accessStatus = normalizedAccessStatus
    }

    if (typeof subscriptionStartDate !== 'undefined') {
      const parsedStartDate = parseOptionalDate(subscriptionStartDate)
      if (parsedStartDate === 'invalid') {
        return res.status(400).json({ error: 'Invalid subscription start date' })
      }
      user.subscriptionStartDate = parsedStartDate
    }

    if (typeof subscriptionEndDate !== 'undefined') {
      const parsedEndDate = parseOptionalDate(subscriptionEndDate)
      if (parsedEndDate === 'invalid') {
        return res.status(400).json({ error: 'Invalid subscription end date' })
      }
      user.subscriptionEndDate = parsedEndDate
    }

    if (typeof isActive === 'boolean') {
      user.isActive = isActive
    }

    if (
      user.subscriptionStartDate &&
      user.subscriptionEndDate &&
      user.subscriptionStartDate > user.subscriptionEndDate
    ) {
      return res.status(400).json({ error: 'Subscription end date must be after the start date' })
    }

    await user.save()

    const updated = await User.findById(user._id)
      .select('-password')
      .populate('role', 'name')
      .lean()

    const userMetrics = await buildUserMetrics([user._id])

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: serializeUser(updated, userMetrics.get(String(user._id))),
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

// ==================== ADMIN OVERVIEW ====================
exports.getAdminOverview = async (req, res) => {
  try {
    const [studentRole, teacherRole, totalCourses, totalMcqs, totalAttempts, roleCounts, paymentSummary, chapterSummary] = await Promise.all([
      Role.findOne({ name: 'student' }).select('_id').lean(),
      Role.findOne({ name: 'teacher' }).select('_id').lean(),
      Course.countDocuments(),
      MCQ.countDocuments(),
      TestSession.countDocuments(),
      Role.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'role',
            as: 'users',
          },
        },
        {
          $project: {
            name: 1,
            total: { $size: '$users' },
            active: {
              $size: {
                $filter: {
                  input: '$users',
                  as: 'user',
                  cond: { $eq: ['$$user.isActive', true] },
                },
              },
            },
          },
        },
      ]),
      Payment.aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                  amount: { $sum: '$amount' },
                },
              },
            ],
            currentMonthRevenue: [
              {
                $match: {
                  status: 'completed',
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  amount: { $sum: '$amount' },
                },
              },
            ],
          },
        },
      ]),
      Course.aggregate([
        {
          $project: {
            chapterCount: { $size: { $ifNull: ['$chapters', []] } },
          },
        },
        {
          $group: {
            _id: null,
            totalChapters: { $sum: '$chapterCount' },
          },
        },
      ]),
    ])

    const studentRoleId = studentRole?._id || null
    const teacherRoleId = teacherRole?._id || null
    const now = new Date()
    const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const [activeSubscriptions, expiringSoon, restrictedStudents, recentStudents] = await Promise.all([
      studentRoleId
        ? User.countDocuments({
            role: studentRoleId,
            subscriptionStatus: 'active',
            $or: [{ subscriptionEndDate: null }, { subscriptionEndDate: { $gte: now } }],
          })
        : 0,
      studentRoleId
        ? User.countDocuments({
            role: studentRoleId,
            subscriptionEndDate: { $gte: now, $lte: weekAhead },
          })
        : 0,
      studentRoleId
        ? User.countDocuments({
            role: studentRoleId,
            $or: [{ accessStatus: { $in: ['restricted', 'expired'] } }, { isActive: false }],
          })
        : 0,
      studentRoleId
        ? User.find({ role: studentRoleId })
            .select('firstName lastName email isActive subscriptionPlan subscriptionStatus subscriptionEndDate accessStatus createdAt')
            .populate('role', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        : [],
    ])

    const recentStudentMetrics = await buildUserMetrics(recentStudents.map((student) => student._id))
    const roleSummary = new Map(roleCounts.map((item) => [item.name, item]))
    const paymentTotals = new Map((paymentSummary[0]?.totals || []).map((item) => [item._id, item]))

    res.status(200).json({
      success: true,
      metrics: {
        totalStudents: roleSummary.get('student')?.total || 0,
        activeStudents: roleSummary.get('student')?.active || 0,
        totalTeachers: roleSummary.get('teacher')?.total || 0,
        activeTeachers: roleSummary.get('teacher')?.active || 0,
        totalCourses,
        totalMcqs,
        totalAttempts,
        totalChapters: chapterSummary[0]?.totalChapters || 0,
        activeSubscriptions,
        expiringSoon,
        restrictedStudents,
        pendingPayments: paymentTotals.get('pending')?.count || 0,
        completedPayments: paymentTotals.get('completed')?.count || 0,
        monthlyRevenue: paymentSummary[0]?.currentMonthRevenue?.[0]?.amount || 0,
      },
      recentStudents: recentStudents.map((student) =>
        serializeUser(student, recentStudentMetrics.get(String(student._id)))),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
