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
  // If email isn't configured locally, let the flow proceed with a debug OTP.
  if (message.includes('email service not configured')) return true
  return allowDebugOtp
}

const logOtpEmailError = (context, error) => {
  // Avoid logging secrets; keep to high-level diagnostics.
  const safe = {
    message: error?.message,
    code: error?.code,
    responseCode: error?.responseCode,
    command: error?.command,
  }
  console.error(`OTP email error (${context}):`, safe)
}

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  try {
    return res.status(403).json({
      error:
        'Student self-registration is disabled. Please continue with Google, then set a password.',
    })

    const firstName = normalizeString(req.body.firstName)
    const lastName = normalizeString(req.body.lastName)
    const email = normalizeEmail(req.body.email)
    const password = req.body.password

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Please provide all required fields' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' })
    }

    if (req.body.role && req.body.role !== 'student') {
      return res
        .status(403)
        .json({ error: 'Only students can self-register.' })
    }

    if (!isGmailAddress(email)) {
      return res
        .status(400)
        .json({ error: 'Student registration requires a Gmail address.' })
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        const otp = generateOtp()
        existingUser.emailOtpHash = hashOtp(otp)
        existingUser.emailOtpExpires = getOtpExpiry()
        await existingUser.save()

        try {
          await sendOtpEmail({
            to: existingUser.email,
            name: existingUser.firstName,
            otp,
          })
        } catch (mailError) {
          logOtpEmailError('resend', mailError)
          if (shouldReturnDebugOtp(mailError)) {
            return res.status(200).json({
              success: true,
              message:
                'OTP generated (email not configured). Use debug OTP to verify.',
              email: existingUser.email,
              debugOtp: otp,
            })
          }
          return res.status(500).json({
            error: 'Failed to send OTP email. Please try again later.',
          })
        }

        return res.status(200).json({
          success: true,
          message: 'OTP resent to your email. Please verify to continue.',
          email: existingUser.email,
        })
      }

      return res.status(400).json({ error: 'Email already registered' })
    }

    // Fetch 'student' role
    const studentRole = await Role.findOne({ name: 'student' })
    if (!studentRole) {
      return res.status(500).json({ error: 'Student role not configured in the system.' })
    }

    const otp = generateOtp()

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: studentRole._id,
      isEmailVerified: false,
      emailOtpHash: hashOtp(otp),
      emailOtpExpires: getOtpExpiry(),
    })

    try {
      await sendOtpEmail({
        to: user.email,
        name: user.firstName,
        otp,
      })

      return res.status(201).json({
        success: true,
        message: 'OTP sent to your email. Please verify before logging in.',
        email: user.email,
      })
    } catch (mailError) {
      logOtpEmailError('send', mailError)
      if (shouldReturnDebugOtp(mailError)) {
        return res.status(201).json({
          success: true,
          message:
            'OTP generated (email not configured). Use debug OTP to verify.',
          email: user.email,
          debugOtp: otp,
        })
      }
      await User.findByIdAndDelete(user._id)
      return res.status(500).json({
        error: 'Failed to send OTP email. Please try again later.',
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = req.body.password

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Please provide email and password' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' })
    }

    // Find user and include password
    const user = await User.findOne({ email }).select(
      '+password role isActive isEmailVerified firstName lastName email hasLocalPassword',
    )
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    if (user.hasLocalPassword === false) {
      return res.status(403).json({
        error:
          'Password not set. Please continue with Google to set a password first.',
      })
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    // OTP/email verification is no longer required.

    const roleDoc = await Role.findById(user.role)
    if (!roleDoc) {
      return res.status(500).json({
        error:
          'Your account role is not configured. Please contact the administrator.',
      })
    }

    // Generate token (role is derived from DB on each request via `protect`)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    })

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleDoc.name, // frontend expects role name string
        roleId: roleDoc._id,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET PROFILE ====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role')
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
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== VERIFY EMAIL OTP ====================
exports.verifyEmail = async (req, res) => {
  try {
    return res.status(410).json({ error: otpDisabledMessage })
    const email = normalizeEmail(req.body.email)
    const otp = normalizeString(req.body.otp)

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' })
    }

    const user = await User.findOne({ email }).select(
      '+emailOtpHash +emailOtpExpires',
    )

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or OTP' })
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified. Please login.',
      })
    }

    if (!user.emailOtpHash || !user.emailOtpExpires) {
      return res.status(400).json({ error: 'OTP not found. Please resend.' })
    }

    if (user.emailOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ error: 'OTP expired. Please resend.' })
    }

    const hashedOtp = hashOtp(otp)
    if (hashedOtp !== user.emailOtpHash) {
      return res.status(400).json({ error: 'Invalid OTP' })
    }

    user.isEmailVerified = true
    user.emailOtpHash = null
    user.emailOtpExpires = null
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== RESEND OTP ====================
exports.resendOtp = async (req, res) => {
  try {
    return res.status(410).json({ error: otpDisabledMessage })
    const email = normalizeEmail(req.body.email)

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: 'Invalid email' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' })
    }

    const otp = generateOtp()
    user.emailOtpHash = hashOtp(otp)
    user.emailOtpExpires = getOtpExpiry()
    await user.save()

    try {
      await sendOtpEmail({
        to: user.email,
        name: user.firstName,
        otp,
      })

      return res.status(200).json({
        success: true,
        message: 'OTP resent to your email',
        email: user.email,
      })
    } catch (mailError) {
      if (shouldReturnDebugOtp(mailError)) {
        return res.status(200).json({
          success: true,
          message:
            'OTP generated (email not configured). Use debug OTP to verify.',
          email: user.email,
          debugOtp: otp,
        })
      }
      return res.status(500).json({
        error: 'Failed to send OTP email. Please try again later.',
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== FORGOT PASSWORD ====================
exports.forgotPassword = async (req, res) => {
  try {
    return res.status(410).json({
      error:
        'Password reset via email OTP is disabled. Please use Google sign-in and set a new password from your profile.',
    })
    const email = normalizeEmail(req.body.email)

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal whether email exists
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a reset OTP has been sent.',
      })
    }

    const otp = generateOtp()
    user.emailOtpHash = hashOtp(otp)
    user.emailOtpExpires = getOtpExpiry()
    await user.save()

    try {
      await sendEmail({
        to: user.email,
        subject: 'MDCAT LMS - Password Reset OTP',
        text: `Hi ${user.firstName},\n\nYour password reset OTP is ${otp}.\nIt expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not request this, please ignore this email.\n\nMDCAT LMS`,
        html: `<p>Hi ${user.firstName},</p><p>Your password reset OTP is <strong>${otp}</strong>.</p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p><p>If you did not request this, please ignore this email.</p><p>MDCAT LMS</p>`,
      })

      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a reset OTP has been sent.',
        email: user.email,
      })
    } catch (mailError) {
      if (shouldReturnDebugOtp(mailError)) {
        return res.status(200).json({
          success: true,
          message: 'OTP generated (email not configured). Use debug OTP.',
          email: user.email,
          debugOtp: otp,
        })
      }
      return res.status(500).json({
        error: 'Failed to send reset email. Please try again later.',
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GOOGLE LOGIN ====================
exports.googleLogin = async (req, res) => {
  try {
    const credential = normalizeString(req.body.credential)

    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' })
    }

    if (!googleClientIds.length || !googleClient) {
      return res.status(500).json({ error: 'Google login is not configured' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientIds,
    })

    const payload = ticket.getPayload()
    const email = normalizeEmail(payload?.email)

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Google account email is invalid' })
    }

    const user = await User.findOne({ email }).select(
      'role isActive isEmailVerified firstName lastName email hasLocalPassword',
    )

    let existingUser = user

    if (!existingUser) {
      const studentRole = await Role.findOne({ name: 'student' })
      if (!studentRole) {
        return res
          .status(500)
          .json({ error: 'Student role not configured in the system.' })
      }

      const firstName = normalizeString(payload?.given_name) || 'Student'
      const lastName = normalizeString(payload?.family_name) || ''

      // Random password (not used for Google login)
      const randomPassword = crypto.randomBytes(16).toString('hex')

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
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    const roleDoc = await Role.findById(existingUser.role)
    if (!roleDoc) {
      return res.status(500).json({
        error:
          'Your account role is not configured. Please contact the administrator.',
      })
    }

    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    })

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: existingUser._id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        role: roleDoc.name,
        roleId: roleDoc._id,
        isEmailVerified: existingUser.isEmailVerified,
        isActive: existingUser.isActive,
        hasLocalPassword: existingUser.hasLocalPassword !== false,
        needsPasswordSetup: existingUser.hasLocalPassword === false,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Google login failed' })
  }
}

// ==================== RESET PASSWORD ====================
exports.resetPassword = async (req, res) => {
  try {
    return res.status(410).json({
      error:
        'Password reset via email OTP is disabled. Please use Google sign-in and set a new password from your profile.',
    })
    const email = normalizeEmail(req.body.email)
    const otp = normalizeString(req.body.otp)
    const newPassword = req.body.newPassword

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Email, OTP, and new password are required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' })
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' })
    }

    const user = await User.findOne({ email }).select(
      '+emailOtpHash +emailOtpExpires +password',
    )

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or OTP' })
    }

    if (!user.emailOtpHash || !user.emailOtpExpires) {
      return res
        .status(400)
        .json({ error: 'No reset request found. Please request a new OTP.' })
    }

    if (user.emailOtpExpires.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ error: 'OTP expired. Please request a new one.' })
    }

    const hashedOtp = hashOtp(otp)
    if (hashedOtp !== user.emailOtpHash) {
      return res.status(400).json({ error: 'Invalid OTP' })
    }

    user.password = newPassword
    user.emailOtpHash = null
    user.emailOtpExpires = null
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login.',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== SET PASSWORD (AFTER GOOGLE SIGN-IN) ====================
exports.setPassword = async (req, res) => {
  try {
    const newPassword = req.body.password
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' })
    }

    const user = await User.findById(req.user.id).select(
      '+password role isActive isEmailVerified firstName lastName email hasLocalPassword',
    )
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.isActive === false) return res.status(403).json({ error: 'Account is deactivated' })

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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    })

    res.status(200).json({
      success: true,
      message: 'Password set successfully.',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleDoc.name,
        roleId: roleDoc._id,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        hasLocalPassword: true,
        needsPasswordSetup: false,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to set password' })
  }
}
