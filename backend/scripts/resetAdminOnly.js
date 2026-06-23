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
const adminFirstName = normalizeText(getArg('admin-first-name'), 'Dr')
const adminLastName = normalizeText(getArg('admin-last-name'), 'Amir')

const ensureArgs = () => {
  const missing = []
  if (!adminEmail) missing.push('admin-email')
  if (!adminPassword) missing.push('admin-password')

  if (missing.length) {
    throw new Error(
      `Missing required arguments: ${missing.join(', ')}\nUsage: node scripts/resetAdminOnly.js --admin-email <email> --admin-password <password>`,
    )
  }
}

const run = async () => {
  ensureArgs()

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in environment (.env)')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const [adminRole, studentRole, teacherRole] = await Promise.all([
    Role.findOne({ name: 'admin' }),
    Role.findOne({ name: 'student' }),
    Role.findOne({ name: 'teacher' }),
  ])

  if (!adminRole || !studentRole || !teacherRole) {
    throw new Error('Required roles not found. Start the backend once so roles are seeded.')
  }

  const deleteResult = await User.deleteMany({
    role: { $in: [studentRole._id, teacherRole._id] },
  })

  let admin = await User.findOne({ email: adminEmail }).select('+password')
  if (!admin) {
    admin = new User({
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      password: adminPassword,
      role: adminRole._id,
      isEmailVerified: true,
      hasLocalPassword: true,
      isActive: true,
      status: 'active',
    })
  } else {
    admin.firstName = adminFirstName
    admin.lastName = adminLastName
    admin.password = adminPassword
    admin.role = adminRole._id
    admin.isEmailVerified = true
    admin.hasLocalPassword = true
    admin.isActive = true
    admin.status = 'active'
  }

  await admin.save()

  console.log(`Deleted student/teacher accounts: ${deleteResult.deletedCount}`)
  console.log(`Admin login: ${admin.email}`)
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
