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

const app = express()

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

// ==================== LOGGING ====================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ==================== BODY PARSERS ====================
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ==================== DATABASE CONNECTION ====================
connectDB()

// ==================== BASIC ROUTES ====================
app.get('/', (req, res) => {
  res.json({ message: 'MDCAT LMS API is Running' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() })
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

// Background scheduler for notification jobs
setInterval(async () => {
  try {
    const now = new Date()
    const jobs = await NotificationJob.find({
      status: 'scheduled',
      sendAt: { $lte: now },
    }).limit(10)

    for (const job of jobs) {
      if (!job.recipientIds.length) {
        job.status = 'sent'
        await job.save()
        continue
      }

      const docs = job.recipientIds.map((recipientId) => ({
        recipientId,
        type: job.type,
        title: job.title,
        message: job.message,
      }))

      await Notification.insertMany(docs)
      job.status = 'sent'
      await job.save()
    }
  } catch (error) {
    console.error('Notification scheduler error:', error.message)
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
