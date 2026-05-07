const User = require('../models/User')
const Role = require('../models/Role')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { sendOtpEmail, sendEmail } = require('../utils/email')
const { OAuth2Client } = require('google-auth-library')

const OTP_EXPIRY_MINUTES = 10
const isDev = process.env.NODE_ENV !== 'production'
const allowDebugOtp = isDev && process.env.ALLOW_DEBUG_OTP === 'true'
const otpDisabledMessage = 'Email OTP is disabled. Please use Google sign-in.'

const googleClientIds = (process.env.GOOGLE_CLIENT_ID || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean)

const googleClient = googleClientIds.length ? new OAuth2Client() : null
const DEFAULT_JWT_EXPIRE = '7d'

const getJwtSecret = () => {
  return (
    process.env.JWT_SECRET ||
    'mdcat-lms-development-secret-change-in-production'
  )
}

const getJwtExpire = () => {
  const value = process.env.JWT_EXPIRE
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return DEFAULT_JWT_EXPIRE

  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_JWT_EXPIRE

  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  if (/^\d+\s*(ms|s|m|h|d|w|y)$/i.test(trimmed))
    return trimmed.replace(/\s+/g, '')

  console.warn(
    `Invalid JWT_EXPIRE value "${trimmed}". Falling back to ${DEFAULT_JWT_EXPIRE}.`,
  )
  return DEFAULT_JWT_EXPIRE
}

const signAuthToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: getJwtExpire(),
  })
}

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

const getOtpExpiry = () => {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
}

const normalizeString = (value) => {
  return typeof value === 'string' ? value.trim() : ''
}

const normalizeEmail = (value) => {
  return normalizeString(value).toLowerCase()
}

const isValidEmail = (value) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(value)
}

const isGmailAddress = (value) => {
  return value.endsWith('@gmail.com') || value.endsWith('@googlemail.com')
}

const shouldReturnDebugOtp = (error) => {
  if (!isDev) return false
  const message = String(error?.message || '').toLowerCase()
  if (message.includes('email service not configured')) return true
  return allowDebugOtp
}

const logOtpEmailError = (context, error) => {
  const safe = {
    message: error?.message,
    code: error?.code,
    responseCode: error?.responseCode,
    command: error?.command,
  }
  console.error(`OTP email error (${context}):`, safe)
}

// Helper to build safe user response object
const buildUserResponse = (user, roleDoc, extra = {}) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: roleDoc.name,
  roleId: roleDoc._id,
  isEmailVerified: user.isEmailVerified,
  isActive: user.isActive,
  hasLocalPassword: user.hasLocalPassword !== false,
  needsPasswordSetup: user.hasLocalPassword === false,
  ...extra,
})

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  try {
    return res.status(403).json({
      error:
        'Student self-registration is disabled. Please continue with Google, then set a password.',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = req.body.password

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Please provide email and password' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' })
    }

    const user = await User.findOne({ email }).select(
      '+password role isActive isEmailVerified firstName lastName email hasLocalPassword',
    )
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    if (user.hasLocalPassword === false) {
      return res.status(403).json({
        error:
          'This account uses Google sign-in. Please click "Continue with Google" to log in.',
      })
    }

    const isPasswordValid = await user.matchPassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    const roleDoc = await Role.findById(user.role)
    if (!roleDoc) {
      return res.status(500).json({
        error:
          'Your account role is not configured. Please contact the administrator.',
      })
    }

    const token = signAuthToken(user._id)

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: buildUserResponse(user, roleDoc),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET PROFILE ====================
exports.getProfile = async (req, res) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role?.name || null,
        roleId: user.role?._id || null,
        phone: user.phone,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        hasLocalPassword: user.hasLocalPassword !== false,
        needsPasswordSetup: user.hasLocalPassword === false,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE PROFILE ====================
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, profilePicture } = req.body

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, profilePicture },
      { new: true, runValidators: true },
    ).populate('role')

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role?.name || null,
        roleId: user.role?._id || null,
        phone: user.phone,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        hasLocalPassword: user.hasLocalPassword !== false,
        needsPasswordSetup: user.hasLocalPassword === false,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== VERIFY EMAIL OTP (disabled) ====================
exports.verifyEmail = async (req, res) => {
  return res.status(410).json({ error: otpDisabledMessage })
}

// ==================== RESEND OTP (disabled) ====================
exports.resendOtp = async (req, res) => {
  return res.status(410).json({ error: otpDisabledMessage })
}

// ==================== FORGOT PASSWORD (disabled) ====================
exports.forgotPassword = async (req, res) => {
  return res.status(410).json({
    error:
      'Password reset via email OTP is disabled. Please use Google sign-in and set a new password from your profile.',
  })
}

// ==================== RESET PASSWORD (disabled) ====================
exports.resetPassword = async (req, res) => {
  return res.status(410).json({
    error:
      'Password reset via email OTP is disabled. Please use Google sign-in and set a new password from your profile.',
  })
}

// ==================== GOOGLE LOGIN ====================
// Handles both signup and signin modes.
// - New user  → creates account with hasLocalPassword:false → needsPasswordSetup:true
// - Existing user → just logs in (no duplicate account created)
exports.googleLogin = async (req, res) => {
  try {
    const credential = normalizeString(req.body.credential)

    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' })
    }

    if (!googleClientIds.length || !googleClient) {
      return res
        .status(500)
        .json({ error: 'Google login is not configured on the server.' })
    }

    let payload
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientIds,
      })
      payload = ticket.getPayload()
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message)
      return res
        .status(401)
        .json({ error: 'Invalid Google credential. Please try again.' })
    }

    const email = normalizeEmail(payload?.email)

    if (!email || !isValidEmail(email)) {
      return res
        .status(400)
        .json({ error: 'Google account email is invalid or missing.' })
    }

    if (!payload?.email_verified) {
      return res
        .status(400)
        .json({ error: 'Google account email is not verified.' })
    }

    // Find existing user — single query, no duplicate creation
    let existingUser = await User.findOne({ email }).select(
      'role isActive isEmailVerified firstName lastName email hasLocalPassword',
    )

    const isNewUser = !existingUser

    if (isNewUser) {
      const studentRole = await Role.findOne({ name: 'student' })
      if (!studentRole) {
        return res
          .status(500)
          .json({ error: 'Student role not configured in the system.' })
      }

      const firstName = normalizeString(payload?.given_name) || 'Student'
      const lastName = normalizeString(payload?.family_name) || ''

      // Random placeholder password — user will set a real one via /set-password
      const randomPassword = crypto.randomBytes(32).toString('hex')

      existingUser = await User.create({
        firstName,
        lastName,
        email,
        password: randomPassword,
        hasLocalPassword: false,
        role: studentRole._id,
        isEmailVerified: true,
        isActive: true,
      })
    }

    if (existingUser.isActive === false) {
      return res
        .status(403)
        .json({
          error: 'Your account has been deactivated. Please contact support.',
        })
    }

    const roleDoc = await Role.findById(existingUser.role)
    if (!roleDoc) {
      return res.status(500).json({
        error:
          'Your account role is not configured. Please contact the administrator.',
      })
    }

    const token = signAuthToken(existingUser._id)

    res.status(200).json({
      success: true,
      message: isNewUser
        ? 'Account created. Please set a password.'
        : 'Logged in successfully.',
      token,
      user: buildUserResponse(existingUser, roleDoc, { isNewUser }),
    })
  } catch (error) {
    console.error('googleLogin error:', error)
    res.status(500).json({ error: error.message || 'Google login failed' })
  }
}

// ==================== SET PASSWORD (AFTER GOOGLE SIGN-IN) ====================
exports.setPassword = async (req, res) => {
  try {
    const newPassword = req.body.password
    if (
      !newPassword ||
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' })
    }

    const user = await User.findById(req.user.id).select(
      '+password role isActive isEmailVerified firstName lastName email hasLocalPassword',
    )
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.isActive === false)
      return res.status(403).json({ error: 'Account is deactivated' })

    user.password = newPassword
    user.hasLocalPassword = true
    user.isEmailVerified = true
    await user.save()

    const roleDoc = await Role.findById(user.role)
    if (!roleDoc) {
      return res.status(500).json({
        error:
          'Your account role is not configured. Please contact the administrator.',
      })
    }

    const token = signAuthToken(user._id)

    res.status(200).json({
      success: true,
      message:
        'Password set successfully. You can now log in with email and password.',
      token,
      user: buildUserResponse(user, roleDoc),
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to set password' })
  }
}
