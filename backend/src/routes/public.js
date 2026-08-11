const express = require('express')
const Course = require('../models/Course')
const MCQ = require('../models/MCQ')
const TestSession = require('../models/TestSession')
const User = require('../models/User')
const Role = require('../models/Role')

const router = express.Router()

const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English']

// Keep a fresh value for five minutes and retain the last good value for a day.
// The Vercel edge cache uses the same policy, so cold/new visitors do not wait
// for Railway and MongoDB whenever a recent public response exists.
let cachedStats = null
let cacheExpiry = 0
const CACHE_TTL_MS = 5 * 60 * 1000
const STALE_TTL_MS = 24 * 60 * 60 * 1000
let staleExpiry = 0
let refreshPromise = null

const setPublicCacheHeaders = (res) => {
  res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400')
  res.set('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
  res.set('Vercel-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
}

const calculateStats = async () => {
  const [chapterTotals, totalMcqs, totalAttempts, studentRole] = await Promise.all([
    Course.aggregate([
      { $match: { category: { $in: SUBJECTS } } },
      { $project: { chapterCount: { $size: { $ifNull: ['$chapters', []] } } } },
      { $group: { _id: null, total: { $sum: '$chapterCount' } } },
    ]),
    MCQ.countDocuments({ isPublished: true }),
    TestSession.countDocuments({}),
    Role.findOne({ name: 'student' }).select('_id').lean(),
  ])

  const totalStudents = studentRole
    ? await User.countDocuments({ role: studentRole._id })
    : 0

  return {
    success: true,
    subjects: SUBJECTS.length,
    totalChapters: chapterTotals[0]?.total || 0,
    totalMcqs,
    totalAttempts,
    totalStudents,
  }
}

const refreshStats = () => {
  if (refreshPromise) return refreshPromise
  refreshPromise = calculateStats()
    .then((result) => {
      const now = Date.now()
      cachedStats = result
      cacheExpiry = now + CACHE_TTL_MS
      staleExpiry = now + STALE_TTL_MS
      return result
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

router.get('/stats', async (req, res) => {
  setPublicCacheHeaders(res)
  try {
    const now = Date.now()
    if (cachedStats && now < cacheExpiry) {
      return res.status(200).json(cachedStats)
    }

    if (cachedStats && now < staleExpiry) {
      refreshStats().catch((error) => {
        console.error('Public stats background refresh failed:', error.message)
      })
      return res.status(200).json(cachedStats)
    }

    const result = await refreshStats()
    res.status(200).json(result)
  } catch (error) {
    if (cachedStats) return res.status(200).json(cachedStats)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
