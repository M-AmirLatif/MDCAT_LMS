require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../src/models/User')
const Role = require('../src/models/Role')

const normalize = (value) => (typeof value === 'string' ? value.trim() : '')

const run = async () => {
  const email = normalize(process.argv[2]).toLowerCase()
  const roleName = normalize(process.argv[3]).toLowerCase()

  if (!email || !roleName) {
    console.error('Usage: node scripts/setUserRole.js <email> <role>')
    console.error('Example: node scripts/setUserRole.js teacher@example.com teacher')
    process.exit(1)
  }

  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI in environment.')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const user = await User.findOne({ email }).select('_id email role isEmailVerified isActive')
  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  const roleDoc = await Role.findOne({ name: roleName })
  if (!roleDoc) {
    console.error(`Role not found: ${roleName}`)
    process.exit(1)
  }

  user.role = roleDoc._id
  await user.save({ validateBeforeSave: false })

  console.log(`Updated ${email} role -> ${roleDoc.name}`)
  await mongoose.disconnect()
}

run().catch(async (err) => {
  console.error(err)
  try {
    await mongoose.disconnect()
  } catch {
    // ignore
  }
  process.exit(1)
})

