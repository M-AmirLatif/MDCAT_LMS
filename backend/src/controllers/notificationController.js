const Notification = require('../models/Notification')
const NotificationJob = require('../models/NotificationJob')
const User = require('../models/User')
const Course = require('../models/Course')

// ==================== GET NOTIFICATIONS ====================
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.user.id,
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== SEND NOTIFICATION ====================
exports.sendNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message } = req.body

    if (!recipientId || !title || !message) {
      return res
        .status(400)
        .json({ error: 'recipientId, title, and message are required' })
    }

    const notification = await Notification.create({
      recipientId,
      type: type || 'general',
      title,
      message,
    })

    res.status(201).json({
      success: true,
      message: 'Notification sent',
      notification,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== MARK AS READ ====================
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body
    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' })
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: req.user.id },
      { isRead: true },
      { new: true },
    )

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.status(200).json({
      success: true,
      notification,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const resolveRecipients = async ({ courseId, role }) => {
  if (courseId) {
    const course = await Course.findById(courseId).select('enrolledStudents')
    return course?.enrolledStudents || []
  }

  const filter = role ? { role } : {}
  const users = await User.find(filter).select('_id')
  return users.map((u) => u._id)
}

// ==================== BROADCAST NOTIFICATION ====================
exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, courseId, role } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' })
    }

    const recipients = await resolveRecipients({ courseId, role })

    if (!recipients.length) {
      return res.status(400).json({ error: 'No recipients found' })
    }

    const docs = recipients.map((recipientId) => ({
      recipientId,
      type: type || 'general',
      title,
      message,
    }))

    await Notification.insertMany(docs)

    res.status(201).json({
      success: true,
      message: 'Broadcast sent',
      count: docs.length,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== SCHEDULE NOTIFICATION ====================
exports.scheduleNotification = async (req, res) => {
  try {
    const { title, message, type, courseId, role, sendAt } = req.body

    if (!title || !message || !sendAt) {
      return res
        .status(400)
        .json({ error: 'title, message, and sendAt are required' })
    }

    const recipients = await resolveRecipients({ courseId, role })

    if (!recipients.length) {
      return res.status(400).json({ error: 'No recipients found' })
    }

    const job = await NotificationJob.create({
      createdBy: req.user.id,
      title,
      message,
      type: type || 'general',
      recipientIds: recipients,
      sendAt: new Date(sendAt),
      status: 'scheduled',
    })

    res.status(201).json({
      success: true,
      message: 'Notification scheduled',
      jobId: job._id,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
