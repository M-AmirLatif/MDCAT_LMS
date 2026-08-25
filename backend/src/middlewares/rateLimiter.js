const rateLimitStore = new Map()

// Hard cap so a hostile or high-traffic day cannot grow this Map without bound.
// The old implementation only overwrote an entry when the same key was seen
// again, so keys (which include per-user email) accumulated for the process
// lifetime — a slow memory leak that ends in an OOM kill on shared hosting.
const MAX_TRACKED_KEYS = 20000
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

const normalizeEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = req.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim()
  }

  return req.ip || req.socket?.remoteAddress || 'unknown'
}

// An IP that identifies the reverse proxy rather than the visitor. Behind
// Hostinger's LiteSpeed/Passenger layer these show up when the forwarding
// headers are missing, and every visitor collapses into one bucket.
const SHARED_PROXY_IPS = new Set([
  'unknown',
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
])

const isSharedProxyIp = (ip) => SHARED_PROXY_IPS.has(String(ip))

/**
 * Reads the `sub` (and email) claim out of a Google ID token WITHOUT verifying
 * it. This is only ever used to bucket rate limits per Google account — the
 * signature is still fully verified later in googleLogin(). Keying on the token
 * subject is what stops one shared proxy IP from rate-limiting every student's
 * Google sign-in at once.
 */
const readUnverifiedJwtSubject = (credential) => {
  try {
    const segments = String(credential).split('.')
    if (segments.length < 2) return ''
    const payload = JSON.parse(
      Buffer.from(
        segments[1].replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString('utf8'),
    )
    const sub = typeof payload?.sub === 'string' ? payload.sub : ''
    const email = normalizeEmail(payload?.email)
    return sub || email
  } catch {
    return ''
  }
}

const getRouteKey = (req) =>
  `${req.baseUrl || ''}${req.path || req.originalUrl || ''}` || 'route'

const getClientKey = (req, scope = 'identity') => {
  const routeKey = getRouteKey(req)
  const ip = getClientIp(req)

  if (scope === 'ip') {
    return `${routeKey}:ip:${ip}`
  }

  // Login traffic on shared hosting can pass through the same proxy IP for many
  // students. Include the identity so one user's retries do not block everyone.
  const email = normalizeEmail(req.body?.email)
  if (email) {
    return `${routeKey}:id:${email}`
  }

  // Google sign-in posts only a `credential`, so there was no identity to key
  // on and every Google login in the system shared a single bucket.
  const subject = req.body?.credential
    ? readUnverifiedJwtSubject(req.body.credential)
    : ''
  if (subject) {
    return `${routeKey}:id:${subject}`
  }

  return `${routeKey}:ip:${ip}`
}

const sweep = () => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.start > entry.windowMs) {
      rateLimitStore.delete(key)
    }
  }
}

const sweepTimer = setInterval(sweep, SWEEP_INTERVAL_MS)
// Never hold the event loop open just for the sweeper.
if (typeof sweepTimer.unref === 'function') sweepTimer.unref()

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  maxRequests = 20,
  // 'identity' keys on email / Google subject and falls back to IP.
  // 'ip' always keys on IP — use it as a second, generous layer so that
  // credential stuffing across many accounts is still bounded.
  scope = 'identity',
  // When the request cannot be attributed to a specific user (no email, no
  // Google subject) we are almost certainly keying on a shared proxy IP. Allow a
  // much higher ceiling there so legitimate traffic is never collectively
  // throttled; per-identity limits do the real work.
  sharedIpMaxRequests = null,
} = {}) => {
  return (req, res, next) => {
    const now = Date.now()
    const key = getClientKey(req, scope)

    const isIpKeyed = key.includes(':ip:')
    const effectiveMax =
      isIpKeyed && isSharedProxyIp(getClientIp(req))
        ? sharedIpMaxRequests ?? maxRequests * 20
        : isIpKeyed
          ? sharedIpMaxRequests ?? maxRequests * 5
          : maxRequests

    const entry = rateLimitStore.get(key)

    if (!entry || now - entry.start > entry.windowMs) {
      // Opportunistic cleanup before growing the map.
      if (rateLimitStore.size >= MAX_TRACKED_KEYS) {
        sweep()
        if (rateLimitStore.size >= MAX_TRACKED_KEYS) {
          // Still full: drop the oldest insertion (Map preserves insertion order).
          const oldestKey = rateLimitStore.keys().next().value
          if (oldestKey !== undefined) rateLimitStore.delete(oldestKey)
        }
      }
      rateLimitStore.set(key, { start: now, count: 1, windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > effectiveMax) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((entry.start + entry.windowMs - now) / 1000),
      )
      res.set('Retry-After', String(retryAfterSec))
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: retryAfterSec,
      })
    }

    return next()
  }
}

module.exports = { createRateLimiter }
// Exported for tests / diagnostics only.
module.exports._internals = { getClientKey, readUnverifiedJwtSubject, rateLimitStore }
