const mongoose = require('mongoose')

const importBatchSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      default: 'CSV upload',
      trim: true,
    },
    subject: {
      type: String,
      enum: ['Biology', 'Chemistry', 'Physics', 'English'],
      default: null,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    chapterId: {
      type: String,
      required: true,
      trim: true,
    },
    topicId: {
      type: String,
      default: null,
      trim: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    importedCount: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    rejectedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
)

importBatchSchema.index({ courseId: 1, chapterId: 1, createdAt: -1 })

module.exports = mongoose.model('ImportBatch', importBatchSchema)
