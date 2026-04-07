const rateLimitStore = new Map()

const getClientKey = (req) => {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown'
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
