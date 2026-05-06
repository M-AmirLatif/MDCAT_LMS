const mongoose = require('mongoose')

const notificationJobSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['test', 'lecture', 'announcement', 'general'],
      default: 'general',
    },
    recipientIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    sendAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent'],
      default: 'scheduled',
    },
  },
  { timestamps: true },
)

// ==================== INDEXES ====================
notificationJobSchema.index({ status: 1, sendAt: 1 })

module.exports = mongoose.model('NotificationJob', notificationJobSchema)
