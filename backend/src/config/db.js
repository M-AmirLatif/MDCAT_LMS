const mongoose = require('mongoose')

const Role = require('../models/Role')
const Permission = require('../models/Permission')
const User = require('../models/User')

const ensurePermission = async (name, category) => {
  let permission = await Permission.findOne({ name })
  if (!permission) permission = await Permission.create({ name, category })
  return permission
}

const ensureRole = async (name, permissionDocs) => {
  let role = await Role.findOne({ name })
  const permissions = permissionDocs.map((p) => p._id)

  if (!role) return Role.create({ name, permissions })

  const current = (role.permissions || []).map(String).sort()
  const next = permissions.map(String).sort()
  const changed = current.length !== next.length || current.some((id, idx) => id !== next[idx])

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

  const superadminRole = await ensureRole('superadmin', [])
  const adminRole = await ensureRole('admin', [manageCourses, takeTests, manageUsers, viewAnalytics])
  const teacherRole = await ensureRole('teacher', [manageCourses])
  const studentRole = await ensureRole('student', [takeTests])

  return { superadminRole, adminRole, teacherRole, studentRole }
}

const migrateLegacyUserRoles = async ({ superadminRole, adminRole, teacherRole, studentRole }) => {
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

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    const roles = await ensureAuthDefaults()
    await migrateLegacyUserRoles(roles)
    console.log('MongoDB Connected')
  } catch (err) {
    console.log('MongoDB Connection Error:', err)
    process.exit(1)
  }
}

module.exports = connectDB
