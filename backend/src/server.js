require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')
const morgan = require('morgan')
const connectDB = require('./config/db')

// ==================== ROUTES ====================
const authRoutes = require('./routes/auth')
const courseRoutes = require('./routes/courses')
const lectureRoutes = require('./routes/lectures')
const mcqRoutes = require('./routes/mcqs')
const testRoutes = require('./routes/tests')
const adminRoutes = require('./routes/admin')
const assignmentRoutes = require('./routes/assignments')
const notificationRoutes = require('./routes/notifications')
const liveSessionRoutes = require('./routes/liveSessions')
const paymentRoutes = require('./routes/payments')
const uploadRoutes = require('./routes/uploads')
const NotificationJob = require('./models/NotificationJob')
const Notification = require('./models/Notification')
const { getEmailStatus } = require('./utils/email')

const app = express()

// Railway terminates HTTPS before forwarding requests to the Node process.
app.set('trust proxy', 1)

// ==================== SECURITY MIDDLEWARES ====================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// ==================== CORS ====================
const normalizeOrigin = (value) => {
  if (!value) return ''
  const trimmed = String(value).trim().replace(/\/+$/, '')
  try {
    const url = new URL(trimmed)
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`.toLowerCase()
  } catch {
    return trimmed.toLowerCase()
  }
}

const rawCorsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => String(o).trim())
  .filter(Boolean)

const allowedOriginSet = new Set(
  rawCorsOrigins
    .filter((o) => o.includes('://'))
    .map((o) => normalizeOrigin(o))
    .filter(Boolean),
)

const allowedHostSet = new Set(
  rawCorsOrigins
    .filter((o) => !o.includes('://'))
    .map((o) => normalizeOrigin(o).replace(/^\./, ''))
    .filter(Boolean),
)

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  const normalized = normalizeOrigin(origin)
  if (allowedOriginSet.has(normalized)) return true

  try {
    const { hostname } = new URL(normalized)
    if (allowedHostSet.has(hostname.toLowerCase())) return true
  } catch {
    // ignore
  }

  // Convenience: allow Vercel preview deploys when the main production domain is allowed.
  if (normalized.endsWith('.vercel.app')) {
    for (const allowed of allowedOriginSet) {
      if (allowed.endsWith('.vercel.app')) return true
    }
    for (const allowedHost of allowedHostSet) {
      if (allowedHost.endsWith('vercel.app')) return true
    }
  }

  return false
}

app.use(
  cors({
    origin(origin, cb) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (isAllowedOrigin(origin)) return cb(null, true)
      cb(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)

// ==================== COMPRESSION ====================
// Compress JSON responses — typically 60-80% size reduction on list endpoints.
// Uses Node built-in zlib; no extra dependency required.
const zlib = require('zlib')
const compressResponse = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || ''
  if (!acceptEncoding.includes('gzip')) return next()

  const originalJson = res.json.bind(res)
  res.json = (body) => {
    const raw = JSON.stringify(body)
    // Only compress responses larger than 1KB
    if (raw.length < 1024) {
      return originalJson(body)
    }
    zlib.gzip(Buffer.from(raw), (err, compressed) => {
      if (err) return originalJson(body)
      res.set('Content-Encoding', 'gzip')
      res.set('Content-Type', 'application/json')
      res.set('Vary', 'Accept-Encoding')
      res.end(compressed)
    })
  }
  next()
}
app.use(compressResponse)

// ==================== LOGGING ====================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ==================== ROUTE TIMING (Phase 5 Observability) ====================
// Lightweight request timing — logs slow routes (>500ms) to help diagnose bottlenecks.
const SLOW_ROUTE_THRESHOLD_MS = parseInt(process.env.SLOW_ROUTE_MS, 10) || 500
app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    // Attach timing header for client-side observability
    if (!res.headersSent) {
      res.set('Server-Timing', `total;dur=${durationMs.toFixed(1)}`)
    }
    if (durationMs > SLOW_ROUTE_THRESHOLD_MS) {
      console.warn(`⚠ Slow route: ${req.method} ${req.originalUrl} — ${durationMs.toFixed(0)}ms`)
    }
  })
  next()
})

// ==================== BODY PARSERS ====================
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Serve uploaded files with long cache (immutable content-addressed uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  immutable: true,
}))

// ==================== DATABASE CONNECTION ====================
connectDB()

// ==================== BASIC ROUTES ====================
app.get('/', (req, res) => {
  res.json({ message: 'MDCAT LMS API is Running' })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    node: process.version,
    email: getEmailStatus(),
  })
})

// Lightweight endpoint to confirm which email provider is active (no secrets).
app.get('/api/health/email', (req, res) => {
  res.json({ email: getEmailStatus(), node: process.version })
})

// ==================== API ROUTES ====================
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/lectures', lectureRoutes)
app.use('/api/mcqs', mcqRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/live-sessions', liveSessionRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/uploads', uploadRoutes)

// ==================== NOTIFICATION SCHEDULER ====================
// Hardened scheduler: uses lean() for read efficiency, atomic findOneAndUpdate
// to prevent duplicate processing across restarts/instances, and uses the
// compound index { status: 1, sendAt: 1 } on NotificationJob.
let schedulerRunning = false
setInterval(async () => {
  if (schedulerRunning) return // prevent overlap
  schedulerRunning = true
  try {
    const now = new Date()
    // Process up to 10 due jobs per tick
    for (let i = 0; i < 10; i++) {
      // Atomically claim the next due job to prevent double-processing
      const job = await NotificationJob.findOneAndUpdate(
        { status: 'scheduled', sendAt: { $lte: now } },
        { $set: { status: 'sent' } },
        { new: false, lean: true },
      )
      if (!job) break // no more due jobs

      if (job.recipientIds && job.recipientIds.length > 0) {
        const docs = job.recipientIds.map((recipientId) => ({
          recipientId,
          type: job.type,
          title: job.title,
          message: job.message,
        }))
        await Notification.insertMany(docs)
      }
    }
  } catch (error) {
    console.error('Notification scheduler error:', error.message)
  } finally {
    schedulerRunning = false
  }
}, 30000)

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
})

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Error:', err)
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
