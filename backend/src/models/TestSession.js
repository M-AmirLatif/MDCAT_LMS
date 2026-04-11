const mongoose = require('mongoose')

const answerSchema = new mongoose.Schema(
  {
    mcqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MCQ',
      required: true,
    },
    selectedIndex: {
      type: Number,
      required: true,
    },
    correctIndex: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false },
)

const testSessionSchema = new mongoose.Schema(
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
    topic: {
      type: String,
      default: null, // null means all topics
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    negativeScore: {
      type: Number,
      default: 0,
    },
    finalScore: {
      type: Number,
      default: 0, // score - negativeScore
    },
    percentage: {
      type: Number,
      required: true,
    },
    timeLimitSeconds: {
      type: Number,
      default: null, // null means untimed
    },
    timeSpentSeconds: {
      type: Number,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['submitted'],
      default: 'submitted',
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
  },
  { timestamps: true },
)

// ==================== INDEXES ====================
testSessionSchema.index({ studentId: 1, courseId: 1 })
testSessionSchema.index({ studentId: 1, submittedAt: -1 })

module.exports = mongoose.model('TestSession', testSessionSchema)
