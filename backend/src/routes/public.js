const express = require('express')
const Course = require('../models/Course')
const MCQ = require('../models/MCQ')
const TestSession = require('../models/TestSession')
const User = require('../models/User')

const router = express.Router()

const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English']

// Cache stats for 5 minutes to avoid hammering the DB on every landing page load
let cachedStats = null
let cacheExpiry = 0
const CACHE_TTL_MS = 5 * 60 * 1000

router.get('/stats', async (req, res) => {
  try {
    const now = Date.now()
    if (cachedStats && now < cacheExpiry) {
      return res.status(200).json(cachedStats)
    }

    const courses = await Course.find({ category: { $in: SUBJECTS } })
      .select('_id category chapters')
      .lean()

    const totalChapters = courses.reduce(
      (sum, course) => sum + (course.chapters?.length || 0),
      0,
    )

    const [totalMcqs, totalAttempts, totalStudents] = await Promise.all([
      MCQ.countDocuments({ isPublished: true }),
      TestSession.countDocuments({}),
      User.countDocuments({}),
    ])

    const result = {
      success: true,
      subjects: SUBJECTS.length,
      totalChapters,
      totalMcqs,
      totalAttempts,
      totalStudents,
    }

    cachedStats = result
    cacheExpiry = now + CACHE_TTL_MS

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
