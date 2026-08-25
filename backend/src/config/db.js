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

  const adminRole = await ensureRole('admin', [manageCourses, takeTests, manageUsers, viewAnalytics])
  const teacherRole = await ensureRole('teacher', [manageCourses])
  const studentRole = await ensureRole('student', [takeTests])

  return { adminRole, teacherRole, studentRole }
}

const migrateLegacyUserRoles = async ({ adminRole, teacherRole, studentRole }) => {
  const legacyUsers = await User.find({ role: { $type: 'string' } }).select('_id role')
  if (legacyUsers.length === 0) return

  const rolesByName = {
    superadmin: adminRole,
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

const isProduction = process.env.NODE_ENV === 'production'

// Building indexes on every cold start is wasteful on shared hosting and is a
// real failure vector (a conflicting build throws and used to kill the process).
// Indexes are created once via `npm run sync-indexes`.
const shouldAutoIndex =
  process.env.MONGO_AUTO_INDEX === 'true' ||
  (!isProduction && process.env.MONGO_AUTO_INDEX !== 'false')

// The legacy string-role migration is a one-time backfill, but it used to run a
// full unindexed User scan on EVERY boot. Opt in explicitly when it is needed.
const shouldRunLegacyMigration =
  process.env.RUN_LEGACY_ROLE_MIGRATION === 'true' ||
  (!isProduction && process.env.RUN_LEGACY_ROLE_MIGRATION !== 'false')

let bootstrapDone = false

/**
 * Seeds roles/permissions. Deliberately non-fatal: on an already-provisioned
 * database these documents exist, and a transient failure here must never take
 * the API down. It is retried on the next successful (re)connection.
 */
const runBootstrap = async () => {
  if (bootstrapDone) return
  try {
    const roles = await ensureAuthDefaults()
    if (shouldRunLegacyMigration) {
      await migrateLegacyUserRoles(roles)
    }
    bootstrapDone = true
    console.log('Auth defaults ready')
  } catch (err) {
    console.error(
      'Auth bootstrap failed (API still serving, will retry on reconnect):',
      err.message,
    )
  }
}

/** True when Mongoose can actually service a query right now. */
const isDbReady = () => mongoose.connection.readyState === 1

const getDbState = () =>
  ['disconnected', 'connected', 'connecting', 'disconnecting'][
    mongoose.connection.readyState
  ] || 'unknown'

let connectStarted = false

const connectWithRetry = async (attempt = 1) => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. The API will return 503 until it is.')
    return
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Connection pool — prevents exhaustion under concurrent load
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
      minPoolSize: 1,
      // Shared hosting has contended CPU and slower DNS/TLS than Railway did.
      // 5s was too aggressive and was the main source of boot-time failures.
      serverSelectionTimeoutMS:
        parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) || 20000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 20000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      autoIndex: shouldAutoIndex,
    })

    console.log('MongoDB Connected')
    await runBootstrap()
  } catch (err) {
    // Never exit. Exiting mid-request is what produced the intermittent
    // "server is temporarily unavailable" errors on the login screen.
    const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt - 1, 5))
    console.error(
      `MongoDB connection attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms`,
    )
    setTimeout(() => {
      connectWithRetry(attempt + 1).catch(() => {})
    }, delay).unref?.()
  }
}

const connectDB = async () => {
  if (connectStarted) return
  connectStarted = true

  const connection = mongoose.connection

  connection.on('error', (err) => {
    console.error('MongoDB error:', err.message)
  })
  connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Driver will attempt to reconnect.')
  })
  connection.on('reconnected', () => {
    console.log('MongoDB reconnected')
    runBootstrap().catch(() => {})
  })

  await connectWithRetry()
}

module.exports = connectDB
module.exports.connectDB = connectDB
module.exports.isDbReady = isDbReady
module.exports.getDbState = getDbState
