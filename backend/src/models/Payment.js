const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      default: 'manual',
    },
    transactionId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

// ==================== INDEXES ====================
paymentSchema.index({ studentId: 1, createdAt: -1 })

module.exports = mongoose.model('Payment', paymentSchema)
