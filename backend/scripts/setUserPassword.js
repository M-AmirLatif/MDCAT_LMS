require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../src/models/User')

const getArg = (name) => {
  const idx = process.argv.findIndex((a) => a === `--${name}`)
  if (idx === -1) return null
  return process.argv[idx + 1] || null
}

const email = (getArg('email') || '').trim().toLowerCase()
const password = getArg('password') || ''

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in environment (.env)')
  }
  if (!email || !password) {
    throw new Error('Usage: node scripts/setUserPassword.js --email <email> --password <password>')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new Error(`User not found for email: ${email}`)
  }

  user.password = password
  user.isEmailVerified = true
  user.isActive = true
  await user.save()

  console.log(`✅ Updated password for ${email}`)
}

run()
  .catch((err) => {
    console.error('❌ Failed to set password:', err.message)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await mongoose.disconnect()
    } catch {
      // ignore
    }
  })

