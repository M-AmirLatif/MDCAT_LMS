const rateLimitStore = new Map()

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

const getClientKey = (req) => {
  const email = normalizeEmail(req.body?.email)
  const routeKey = `${req.baseUrl || ''}${req.path || req.originalUrl || ''}` || 'route'

  // Login traffic on shared hosting can pass through the same proxy IP for many
  // students. Include the email so one user's retries do not block everyone.
  if (req.path === '/login' && email) {
    return `${routeKey}:email:${email}:ip:${getClientIp(req)}`
  }

  return `${routeKey}:ip:${getClientIp(req)}`
}

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  maxRequests = 20,
} = {}) => {
  return (req, res, next) => {
    const now = Date.now()
    const key = getClientKey(req)
    const entry = rateLimitStore.get(key)

    if (!entry || now - entry.start > windowMs) {
      rateLimitStore.set(key, { start: now, count: 1 })
      return next()
    }

    entry.count += 1
    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      })
    }

    return next()
  }
}

module.exports = { createRateLimiter }
