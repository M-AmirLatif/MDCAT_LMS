const mongoose = require('mongoose')

const mcqReportSchema = new mongoose.Schema(
  {
    mcqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MCQ',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    studentName: {
      type: String,
      default: 'Anonymous Student',
    },
    studentEmail: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    chapterId: {
      type: String,
      default: '',
    },
    chapterName: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      default: '',
    },
    questionSnapshot: {
      type: String,
      default: '',
    },
    issueType: {
      type: String,
      enum: ['wrong_key', 'question_typo', 'explanation_issue', 'broken_image', 'other'],
      default: 'wrong_key',
    },
    description: {
      type: String,
      required: [true, 'Please provide issue details'],
      trim: true,
    },
    selectedOption: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

mcqReportSchema.index({ subject: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model('McqReport', mcqReportSchema)
