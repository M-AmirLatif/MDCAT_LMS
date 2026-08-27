require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const mongoose = require('mongoose')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const connectDB = require('./config/db')
const { isDbReady, getDbState } = require('./config/db')

// ==================== CRASH GUARDS ====================
// Node exits the process on an unhandled rejection, and an uncaught exception
// kills it outright. On Hostinger shared hosting that means every in-flight
// request dies with a bare connection reset, which the browser reports as
// "Network Error" — the intermittent login failure users were seeing.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason)
})

// Recoverable, well-understood faults: log and keep serving. Anything else may
// have left the process in an undefined state, so drain and let the supervisor
// (Passenger/PM2) respawn a clean one instead of serving corrupt responses.
const RECOVERABLE_ERROR_CODES = new Set([
  'ERR_HTTP_HEADERS_SENT',
  'ERR_STREAM_WRITE_AFTER_END',
  'ECONNRESET',
  'EPIPE',
  'ECANCELED',
])

let shuttingDown = false
let httpServer = null

process.on('uncaughtException', (err) => {
  if (RECOVERABLE_ERROR_CODES.has(err?.code)) {
    console.error(`Recoverable uncaught exception (${err.code}):`, err.message)
    return
  }

  console.error('Fatal uncaught exception:', err)
  if (shuttingDown) return
  shuttingDown = true

  // Stop accepting new connections, give in-flight requests a moment, then exit
  // non-zero so the process manager restarts us.
  const forceExit = setTimeout(() => process.exit(1), 5000)
  forceExit.unref()
  if (httpServer) {
    httpServer.close(() => process.exit(1))
  } else {
    process.exit(1)
  }
})

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
const subscriptionRoutes = require('./routes/subscriptions')
const uploadRoutes = require('./routes/uploads')
const publicRoutes = require('./routes/public')
const { serveUpload } = require('./controllers/uploadController')
const NotificationJob = require('./models/NotificationJob')
const Notification = require('./models/Notification')
const { getEmailStatus } = require('./utils/email')

const app = express()

// Identifies this specific process in /api/health/db, so you can tell which
// backend a domain is really hitting when more than one deployment is live.
const INSTANCE_ID = `${process.pid}-${Date.now().toString(36)}`

// Only ONE deployment may run the notification scheduler. While both Hostinger
// and Railway were live against the same Atlas database, both were claiming and
// sending the same jobs.
const SCHEDULER_ENABLED = process.env.ENABLE_SCHEDULER !== 'false'

// Hostinger web apps can become idle between student visits. The next login then
// becomes the wake-up request and may time out on mobile. Keep-alive is enabled
// by default only for the Hostinger production backend and pings a cheap health
// endpoint; disable with ENABLE_KEEP_ALIVE=false if needed.
const KEEP_ALIVE_ENABLED =
  process.env.ENABLE_KEEP_ALIVE === 'true' ||
  (
    process.env.ENABLE_KEEP_ALIVE !== 'false' &&
    process.env.NODE_ENV === 'production' &&
    process.env.DEPLOYMENT_TARGET === 'hostinger'
  )
const KEEP_ALIVE_URL =
  process.env.KEEP_ALIVE_URL ||
  process.env.PUBLIC_API_HEALTH_URL ||
  'https://api.acemdcat.com/api/health/db'
const KEEP_ALIVE_INTERVAL_MS = Math.max(
  60000,
  parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10) || 4 * 60 * 1000,
)

// Hostinger (LiteSpeed/Passenger) and Railway both terminate HTTPS in front of
// the Node process. The number of proxy hops differs per host, so make it
// configurable — getting this wrong makes every client look like one IP, which
// collapses rate limiting into a single shared bucket.
const trustProxyRaw = (process.env.TRUST_PROXY || '1').trim()
app.set(
  'trust proxy',
  trustProxyRaw === 'true'
    ? true
    : trustProxyRaw === 'false'
      ? false
      : /^\d+$/.test(trustProxyRaw)
        ? Number(trustProxyRaw)
        : trustProxyRaw,
)

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

const requiredProductionOrigins = [
  'https://www.acemdcat.com',
  'https://acemdcat.com',
  'https://mdcat-lms.vercel.app',
]

requiredProductionOrigins.forEach((origin) =>
  allowedOriginSet.add(normalizeOrigin(origin)),
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
// Compress responses — typically 60-80% size reduction on JSON list endpoints.
// Uses the standard `compression` package; threshold skips tiny responses.
app.use(compression({ threshold: 1024 }))

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
app.get('/uploads/:filename', serveUpload)

// ==================== DATABASE CONNECTION ====================
// Fire-and-forget: connectDB retries internally with backoff and never throws,
// so a slow or briefly unreachable Atlas cluster no longer prevents boot.
connectDB().catch((err) => {
  console.error('connectDB unexpected failure:', err.message)
})

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

// Deployment identity + database reachability. Use this to confirm which backend
// a domain actually resolves to (Hostinger vs the old Railway service) and
// whether Mongo is connected, without needing shell access.
app.get('/api/health/db', (req, res) => {
  const ready = isDbReady()
  res.status(ready ? 200 : 503).json({
    status: ready ? 'OK' : 'DEGRADED',
    dbState: getDbState(),
    instanceId: INSTANCE_ID,
    deploymentTarget: process.env.DEPLOYMENT_TARGET || 'unset',
    schedulerEnabled: SCHEDULER_ENABLED,
    keepAliveEnabled: KEEP_ALIVE_ENABLED,
    uptimeSeconds: Math.round(process.uptime()),
    node: process.version,
    timestamp: new Date(),
  })
})

// ==================== DB READINESS GATE ====================
// app.listen() starts immediately, before Mongo finishes connecting. Requests
// that arrived in that window used to sit on Mongoose's command buffer and then
// fail opaquely. Answer with a real, CORS-enabled 503 + Retry-After instead so
// the browser gets a response it can read and the client can retry cleanly.
const DB_WAIT_EXEMPT = new Set(['/api/health', '/api/health/db', '/api/health/email'])

app.use('/api', (req, res, next) => {
  if (DB_WAIT_EXEMPT.has(req.originalUrl.split('?')[0])) return next()
  if (isDbReady()) return next()

  res.set('Retry-After', '3')
  return res.status(503).json({
    error: 'The service is starting up. Please retry in a moment.',
    code: 'DB_UNAVAILABLE',
    dbState: getDbState(),
  })
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
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/public', publicRoutes)

// ==================== NOTIFICATION SCHEDULER ====================
// Hardened scheduler: uses lean() for read efficiency, atomic findOneAndUpdate
// to prevent duplicate processing across restarts/instances, and uses the
// compound index { status: 1, sendAt: 1 } on NotificationJob.
//
// Set ENABLE_SCHEDULER=false on every deployment except the one you designate as
// the worker. It also skips ticks while Mongo is down, so a disconnected process
// no longer logs an error every 30 seconds.
let schedulerRunning = false
let schedulerTimer = null

if (SCHEDULER_ENABLED) {
  schedulerTimer = setInterval(async () => {
    if (schedulerRunning) return // prevent overlap
    if (!isDbReady()) return // nothing to do until Mongo is back
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
} else {
  console.log('Notification scheduler disabled on this instance')
}

// ==================== HOSTINGER KEEP-ALIVE ====================
let keepAliveTimer = null

if (KEEP_ALIVE_ENABLED && KEEP_ALIVE_URL) {
  const pingKeepAlive = async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      timeout.unref?.()

      await fetch(KEEP_ALIVE_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeout)
    } catch (error) {
      // Non-fatal. The next interval tries again; never crash the API because
      // a background keep-alive ping failed.
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Keep-alive ping failed:', error.message)
      }
    }
  }

  keepAliveTimer = setInterval(pingKeepAlive, KEEP_ALIVE_INTERVAL_MS)
  keepAliveTimer.unref?.()
  setTimeout(pingKeepAlive, 15000).unref?.()
}

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
})

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Error:', err)

  // A rejected CORS origin previously fell through to a generic 500 with no
  // CORS headers, which the browser surfaces as an unexplained "Network Error".
  // Answer explicitly so the real cause is visible in the response body.
  if (err && /Not allowed by CORS/i.test(err.message || '')) {
    return res.status(403).json({
      error: 'Origin not allowed by CORS',
      code: 'CORS_REJECTED',
      origin: req.headers.origin || null,
    })
  }

  if (res.headersSent) return next(err)

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000
httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (instance ${INSTANCE_ID})`)
})

// Keep sockets from being held open indefinitely behind the host's proxy.
httpServer.keepAliveTimeout = 65000
httpServer.headersTimeout = 66000

httpServer.on('error', (err) => {
  console.error('HTTP server error:', err.message)
})

// ==================== GRACEFUL SHUTDOWN ====================
const shutdown = (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`${signal} received, shutting down gracefully`)

  if (schedulerTimer) clearInterval(schedulerTimer)
  if (keepAliveTimer) clearInterval(keepAliveTimer)

  const forceExit = setTimeout(() => process.exit(0), 10000)
  forceExit.unref()

  httpServer.close(() => {
    mongoose.connection
      .close(false)
      .catch(() => {})
      .finally(() => process.exit(0))
  })
}

;['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => shutdown(signal))
})
