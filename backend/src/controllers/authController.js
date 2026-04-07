const User = require('../models/User')
const jwt = require('jsonwebtoken')

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

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'student',
    })

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      },
    )

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
