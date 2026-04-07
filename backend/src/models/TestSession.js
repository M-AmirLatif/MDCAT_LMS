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
    totalQuestions: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
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

module.exports = mongoose.model('TestSession', testSessionSchema)
