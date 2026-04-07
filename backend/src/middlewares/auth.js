const jwt = require('jsonwebtoken')

// ==================== PROTECT ROUTE (Verify JWT) ====================
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res
        .status(401)
        .json({ error: 'Not authorized to access this route' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Not authorized to access this route' })
  }
}

// ==================== AUTHORIZE ROLES ====================
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to access this route' })
    }
    next()
  }
}
