const LiveSession = require('../models/LiveSession')
const Course = require('../models/Course')

// ==================== CREATE LIVE SESSION ====================
exports.createLiveSession = async (req, res) => {
  try {
    const { courseId, title, description, scheduledAt, joinUrl } = req.body

    if (!courseId || !title || !joinUrl) {
      return res
        .status(400)
        .json({ error: 'courseId, title, and joinUrl are required' })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    if (
      course.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to schedule live sessions' })
    }

    const session = await LiveSession.create({
      courseId,
      teacherId: req.user.id,
      title,
      description: description || '',
      scheduledAt: scheduledAt || null,
      joinUrl,
    })

    res.status(201).json({
      success: true,
      message: 'Live session created',
      session,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== LIST LIVE SESSIONS ====================
exports.getLiveSessions = async (req, res) => {
  try {
    const filter = {}
    if (req.query.courseId) {
      filter.courseId = req.query.courseId
    }

    const sessions = await LiveSession.find(filter)
      .populate('courseId', 'name category')
      .populate('teacherId', 'firstName lastName email')
      .sort({ scheduledAt: -1 })

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== END LIVE SESSION ====================
exports.endLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.sessionId)
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    session.status = 'ended'
    await session.save()

    res.status(200).json({
      success: true,
      message: 'Session ended',
      session,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
