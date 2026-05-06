const mongoose = require('mongoose')

const liveSessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    joinUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    recordingUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

// ==================== INDEXES ====================
liveSessionSchema.index({ courseId: 1, scheduledAt: -1 })

module.exports = mongoose.model('LiveSession', liveSessionSchema)
