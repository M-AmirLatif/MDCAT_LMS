require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../src/models/User')
const Role = require('../src/models/Role')

const getArg = (name) => {
  const idx = process.argv.findIndex((arg) => arg === `--${name}`)
  if (idx === -1) return null
  return process.argv[idx + 1] || null
}

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()
const normalizeText = (value, fallback) => String(value || fallback || '').trim()

const adminEmail = normalizeEmail(getArg('admin-email'))
const adminPassword = getArg('admin-password') || ''
const adminFirstName = normalizeText(getArg('admin-first-name'), 'Admin')
const adminLastName = normalizeText(getArg('admin-last-name'), 'User')

const teacherEmail = normalizeEmail(getArg('teacher-email'))
const teacherPassword = getArg('teacher-password') || ''
const teacherFirstName = normalizeText(getArg('teacher-first-name'), 'Teacher')
const teacherLastName = normalizeText(getArg('teacher-last-name'), 'User')

const required = [
  ['admin-email', adminEmail],
  ['admin-password', adminPassword],
  ['teacher-email', teacherEmail],
  ['teacher-password', teacherPassword],
]

const ensureArgs = () => {
  const missing = required.filter(([, value]) => !value).map(([name]) => name)
  if (missing.length) {
    throw new Error(
      `Missing required arguments: ${missing.join(', ')}\nUsage: node scripts/resetStaffAccess.js --admin-email <email> --admin-password <password> --teacher-email <email> --teacher-password <password> [--admin-first-name <name>] [--admin-last-name <name>] [--teacher-first-name <name>] [--teacher-last-name <name>]`,
    )
  }

  if (adminEmail === teacherEmail) {
    throw new Error('Admin and teacher emails must be different.')
  }
}

const upsertStaffUser = async ({
  email,
  password,
  firstName,
  lastName,
  roleId,
}) => {
  let user = await User.findOne({ email }).select('+password')

  if (!user) {
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role: roleId,
      isEmailVerified: true,
      hasLocalPassword: true,
      isActive: true,
    })
  } else {
    user.firstName = firstName
    user.lastName = lastName
    user.password = password
    user.role = roleId
    user.isEmailVerified = true
    user.hasLocalPassword = true
    user.isActive = true
  }

  await user.save()
  return user
}

const run = async () => {
  ensureArgs()

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in environment (.env)')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const [adminRole, teacherRole] = await Promise.all([
    Role.findOne({ name: 'admin' }),
    Role.findOne({ name: 'teacher' }),
  ])

  if (!adminRole || !teacherRole) {
    throw new Error('Admin/teacher roles not found in database.')
  }

  const roleIds = [adminRole._id, teacherRole._id]
  const keepEmails = [adminEmail, teacherEmail]

  const deactivated = await User.updateMany(
    {
      role: { $in: roleIds },
      email: { $nin: keepEmails },
    },
    {
      $set: {
        isActive: false,
      },
    },
  )

  const [adminUser, teacherUser] = await Promise.all([
    upsertStaffUser({
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      roleId: adminRole._id,
    }),
    upsertStaffUser({
      email: teacherEmail,
      password: teacherPassword,
      firstName: teacherFirstName,
      lastName: teacherLastName,
      roleId: teacherRole._id,
    }),
  ])

  console.log(`Deactivated previous staff accounts: ${deactivated.modifiedCount}`)
  console.log(`Admin login: ${adminUser.email}`)
  console.log(`Teacher login: ${teacherUser.email}`)
}

run()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await mongoose.disconnect()
    } catch {
      // ignore
    }
  })
