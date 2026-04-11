const User = require('../models/User')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { sendOtpEmail, sendEmail } = require('../utils/email')

const OTP_EXPIRY_MINUTES = 10
const isDev = process.env.NODE_ENV !== 'production'

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

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  try {
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
          if (isDev) {
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

    const otp = generateOtp()

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'student',
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
      if (isDev) {
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
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    if (!user.isEmailVerified) {
      return res
        .status(403)
        .json({ error: 'Email not verified. Please verify your email.' })
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      },
    )

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET PROFILE ====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.status(200).json({
      success: true,
      user,
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
    )

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== VERIFY EMAIL OTP ====================
exports.verifyEmail = async (req, res) => {
  try {
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
      if (isDev) {
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
      if (isDev) {
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

// ==================== RESET PASSWORD ====================
exports.resetPassword = async (req, res) => {
  try {
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
