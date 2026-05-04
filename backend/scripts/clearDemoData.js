require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../src/models/User')
const Course = require('../src/models/Course')
const MCQ = require('../src/models/MCQ')
const TestSession = require('../src/models/TestSession')
const Payment = require('../src/models/Payment')
const Notification = require('../src/models/Notification')
const NotificationJob = require('../src/models/NotificationJob')

const DEMO_EMAILS = [
  'superadmin@mdcat.com',
  'admin@mdcat.com',
  'teacher@mdcat.com',
  'teacher2@mdcat.com',
]

const main = async () => {
  if (process.env.CLEAR_DEMO_DATA !== 'yes') {
    throw new Error('Refusing to clear data. Run with CLEAR_DEMO_DATA=yes after confirming you want an empty production content state.')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const [sessions, payments, notifications, jobs, mcqs, courses, users] = await Promise.all([
    TestSession.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
    NotificationJob.deleteMany({}),
    MCQ.deleteMany({}),
    Course.deleteMany({}),
    User.deleteMany({ email: { $in: DEMO_EMAILS } }),
  ])

  console.log('Demo data cleanup completed.')
  console.log(`Removed test sessions: ${sessions.deletedCount}`)
  console.log(`Removed payments: ${payments.deletedCount}`)
  console.log(`Removed notifications: ${notifications.deletedCount}`)
  console.log(`Removed notification jobs: ${jobs.deletedCount}`)
  console.log(`Removed MCQs: ${mcqs.deletedCount}`)
  console.log(`Removed courses: ${courses.deletedCount}`)
  console.log(`Removed demo staff users: ${users.deletedCount}`)
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
