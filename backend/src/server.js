require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

// ==================== ROUTES ====================
const authRoutes = require('./routes/auth')

const app = express()

// ==================== MIDDLEWARES ====================
app.use(express.json())
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cors())

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

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/lectures', lectureRoutes)
app.use('/api/mcqs', mcqRoutes)

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
