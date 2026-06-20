const mongoose = require('mongoose')

const paymentRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    selectedSubjects: {
      type: [String],
      enum: ['Biology', 'Chemistry', 'Physics', 'English'],
      required: true,
      validate: [
        (value) => Array.isArray(value) && value.length > 0,
        'Select at least one subject',
      ],
    },
    amount: {
      type: Number,
      required: true,
      min: 1000,
    },
    paymentMethod: {
      type: String,
      enum: ['JazzCash', 'Easypaisa'],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    screenshotUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

paymentRequestSchema.index({ createdAt: -1 })
paymentRequestSchema.index({ studentId: 1, createdAt: -1 })

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema)
