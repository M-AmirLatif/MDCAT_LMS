const mongoose = require('mongoose')

const Role = require('../models/Role')
const Permission = require('../models/Permission')
const User = require('../models/User')

const ensurePermission = async (name, category) => {
  let permission = await Permission.findOne({ name })
  if (!permission) {
    permission = await Permission.create({ name, category })
  }
  return permission
}

const ensureRole = async (name, permissionDocs) => {
  let role = await Role.findOne({ name })
  const permissions = permissionDocs.map((p) => p._id)

  if (!role) {
    return Role.create({ name, permissions })
  }

  const current = (role.permissions || []).map(String).sort()
  const next = permissions.map(String).sort()
  const changed =
    current.length !== next.length ||
    current.some((id, idx) => id !== next[idx])

  if (changed) {
    role.permissions = permissions
    await role.save()
  }

  return role
}

const ensureAuthDefaults = async () => {
  const manageCourses = await ensurePermission('manage_courses', 'teacher')
  const takeTests = await ensurePermission('take_tests', 'student')
  const manageUsers = await ensurePermission('manage_users', 'admin')
  const viewAnalytics = await ensurePermission('view_analytics', 'admin')

  const superadminRole = await ensureRole('superadmin', []) // bypasses checks in middleware
  const adminRole = await ensureRole('admin', [manageCourses, takeTests, manageUsers, viewAnalytics])
  const teacherRole = await ensureRole('teacher', [manageCourses])
  const studentRole = await ensureRole('student', [takeTests])

  return { superadminRole, adminRole, teacherRole, studentRole }
}

const migrateLegacyUserRoles = async ({ superadminRole, adminRole, teacherRole, studentRole }) => {
  // Some older DBs stored `users.role` as a string (e.g. "teacher") instead of Role ObjectId.
  const legacyUsers = await User.find({ role: { $type: 'string' } }).select('_id role')
  if (legacyUsers.length === 0) return

  const rolesByName = {
    superadmin: superadminRole,
    admin: adminRole,
    teacher: teacherRole,
    student: studentRole,
  }

  for (const user of legacyUsers) {
    const roleName = typeof user.role === 'string' ? user.role.toLowerCase() : ''
    const roleDoc = rolesByName[roleName]
    if (!roleDoc) continue

    user.role = roleDoc._id
    await user.save({ validateBeforeSave: false })
  }
}

const ensureStaffDefaults = async ({ superadminRole, adminRole, teacherRole }) => {
  const defaults = [
    {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@mdcat.com',
      password: 'SuperAdmin@123',
      role: superadminRole,
    },
    {
      firstName: 'Amir',
      lastName: 'Latif',
      email: 'admin@mdcat.com',
      password: 'Admin@123',
      role: adminRole,
    },
    {
      firstName: 'Dr. Ayesha',
      lastName: 'Khan',
      email: 'teacher@mdcat.com',
      password: 'Teacher@123',
      role: teacherRole,
    },
    {
      firstName: 'Sana',
      lastName: 'Malik',
      email: 'teacher2@mdcat.com',
      password: 'Teacher2@123',
      role: teacherRole,
    },
  ]

  for (const data of defaults) {
    const existing = await User.findOne({ email: data.email }).select(
      '+password _id role isEmailVerified isActive hasLocalPassword',
    )

    if (!existing) {
      await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role?._id,
        isEmailVerified: true,
        isActive: true,
      })
      continue
    }

    let changed = false
    const passwordMatches = existing.password
      ? await existing.matchPassword(data.password)
      : false

    if (!existing.role || String(existing.role) !== String(data.role?._id)) {
      existing.role = data.role?._id
      changed = true
    }
    if (!passwordMatches) {
      existing.password = data.password
      changed = true
    }
    if (existing.hasLocalPassword === false) {
      existing.hasLocalPassword = true
      changed = true
    }
    if (!existing.isEmailVerified) {
      existing.isEmailVerified = true
      changed = true
    }
    if (existing.isActive === false) {
      existing.isActive = true
      changed = true
    }

    if (changed) {
      await existing.save({ validateBeforeSave: false })
    }
  }
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    const roles = await ensureAuthDefaults()
    await migrateLegacyUserRoles(roles)
    await ensureStaffDefaults(roles)
    console.log('✅ MongoDB Connected')
  } catch (err) {
    console.log('❌ MongoDB Connection Error:', err)
    process.exit(1)
  }
}

module.exports = connectDB
