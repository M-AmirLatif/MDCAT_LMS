require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')

// ==================== ROUTES ====================
const authRoutes = require('./routes/auth')

const app = express()

// ==================== MIDDLEWARES ====================
app.use(express.json())
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cors())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ==================== DATABASE CONNECTION ====================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB Connected')
  })
  .catch((err) => {
    console.log('❌ MongoDB Connection Error:', err)
    process.exit(1)
  })

// ==================== BASIC ROUTES ====================
app.get('/', (req, res) => {
  res.json({ message: 'MDCAT LMS API is Running' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() })
})

// ==================== API ROUTES ====================
const courseRoutes = require('./routes/courses')
const lectureRoutes = require('./routes/lectures')
const mcqRoutes = require('./routes/mcqs')
const testRoutes = require('./routes/tests')
const adminRoutes = require('./routes/admin')
const assignmentRoutes = require('./routes/assignments')
const notificationRoutes = require('./routes/notifications')
const liveSessionRoutes = require('./routes/liveSessions')
const paymentRoutes = require('./routes/payments')
const uploadRoutes = require('./routes/uploads')
const NotificationJob = require('./models/NotificationJob')
const Notification = require('./models/Notification')

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/lectures', lectureRoutes)
app.use('/api/mcqs', mcqRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/live-sessions', liveSessionRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/uploads', uploadRoutes)

// Background scheduler for notification jobs
setInterval(async () => {
  try {
    const now = new Date()
    const jobs = await NotificationJob.find({
      status: 'scheduled',
      sendAt: { $lte: now },
    }).limit(10)

    for (const job of jobs) {
      if (!job.recipientIds.length) {
        job.status = 'sent'
        await job.save()
        continue
      }

      const docs = job.recipientIds.map((recipientId) => ({
        recipientId,
        type: job.type,
        title: job.title,
        message: job.message,
      }))

      await Notification.insertMany(docs)
      job.status = 'sent'
      await job.save()
    }
  } catch (error) {
    console.error('Notification scheduler error:', error.message)
  }
}, 30000)

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: err.message })
})

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
