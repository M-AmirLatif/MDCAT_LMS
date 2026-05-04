require('dotenv').config()
const mongoose = require('mongoose')

const Role = require('./src/models/Role')
const Permission = require('./src/models/Permission')

const connect = async () => mongoose.connect(process.env.MONGO_URI)

const ensurePermission = async (name, category) => {
  let permission = await Permission.findOne({ name })
  if (!permission) permission = await Permission.create({ name, category })
  return permission
}

const ensureRole = async (name, permissions) => {
  let role = await Role.findOne({ name })
  const permissionIds = permissions.map((item) => item._id)

  if (!role) {
    role = await Role.create({ name, permissions: permissionIds })
  } else {
    role.permissions = permissionIds
    await role.save()
  }

  return role
}

const seed = async () => {
  console.log('Bootstrapping production roles and permissions only...')

  const permManageCourses = await ensurePermission('manage_courses', 'teacher')
  const permTakeTests = await ensurePermission('take_tests', 'student')
  const permManageUsers = await ensurePermission('manage_users', 'admin')
  const permViewAnalytics = await ensurePermission('view_analytics', 'admin')

  await ensureRole('superadmin', [permManageCourses, permTakeTests, permManageUsers, permViewAnalytics])
  await ensureRole('admin', [permManageCourses, permTakeTests, permManageUsers, permViewAnalytics])
  await ensureRole('teacher', [permManageCourses])
  await ensureRole('student', [permTakeTests])

  console.log('Production bootstrap completed. No users, chapters, MCQs, attempts, payments, notifications, or logs were seeded.')
}

connect()
  .then(seed)
  .catch((error) => console.error(error))
  .finally(() => mongoose.disconnect())
