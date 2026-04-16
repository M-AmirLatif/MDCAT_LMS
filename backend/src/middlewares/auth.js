const jwt = require('jsonwebtoken')
const User = require('../models/User')

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
    
    // Fetch full user with role and permissions to ensure fresh data
    const user = await User.findById(decoded.id).populate({
      path: 'role',
      populate: { path: 'permissions' }
    })
    
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' })
    }
    if (user.isActive === false) {
       return res.status(403).json({ error: 'Account is deactivated' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Not authorized to access this route' })
  }
}

// ==================== AUTHORIZE PERMISSIONS ====================
exports.authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    const roleName = req.user?.role?.name || null

    // If user's role is named 'superadmin', they bypass all checks
    if (roleName === 'superadmin') {
      return next()
    }

    const knownRoles = new Set(['student', 'teacher', 'admin', 'superadmin'])
    const onlyRoles =
      requiredPermissions.length > 0 &&
      requiredPermissions.every((p) => knownRoles.has(p))

    // Back-compat: some routes pass role names instead of permission names
    if (onlyRoles) {
      if (!roleName) {
        return res.status(403).json({ error: 'Not authorized, role missing' })
      }
      if (!requiredPermissions.includes(roleName)) {
        return res.status(403).json({ error: 'Not authorized for this role' })
      }
      return next()
    }
    
    if (!req.user.role || !req.user.role.permissions) {
      return res
        .status(403)
        .json({ error: 'Not authorized, no permissions found' })
    }

    // Extract all permission names user possesses
    const userPermissionNames = req.user.role.permissions.map(p => p.name)

    // Check if user has ALL the required permissions
    const hasAccess = requiredPermissions.every(rp => userPermissionNames.includes(rp))

    if (!hasAccess) {
      return res
        .status(403)
        .json({ error: `Not authorized. Requires permissions: ${requiredPermissions.join(', ')}` })
    }
    
    next()
  }
}
