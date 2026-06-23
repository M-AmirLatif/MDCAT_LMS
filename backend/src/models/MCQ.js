const mongoose = require('mongoose')

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Option text is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
)

const mcqSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    topic: {
      type: String,
      required: [true, 'Please provide topic'],
      trim: true,
    },
    subject: {
      type: String,
      enum: ['Biology', 'Chemistry', 'Physics', 'English'],
      default: null,
    },
    chapterId: {
      type: String,
      default: null,
      trim: true,
    },
    chapterName: {
      type: String,
      default: null,
      trim: true,
    },
    topicId: {
      type: String,
      default: null,
      trim: true,
    },
    question: {
      type: String,
      required: [true, 'Please provide question'],
    },
    questionText: {
      type: String,
      default: '',
    },
    questionImages: {
      type: [String],
      default: [],
    },
    options: {
      type: [optionSchema],
      validate: [
        (value) => Array.isArray(value) && value.length >= 2,
        'At least two options are required',
      ],
    },
    optionA: { type: String, default: '' },
    optionAImages: { type: [String], default: [] },
    optionB: { type: String, default: '' },
    optionBImages: { type: [String], default: [] },
    optionC: { type: String, default: '' },
    optionCImages: { type: [String], default: [] },
    optionD: { type: String, default: '' },
    optionDImages: { type: [String], default: [] },
    explanation: {
      type: String,
      default: null,
    },
    explanationText: {
      type: String,
      default: '',
    },
    explanationImages: {
      type: [String],
      default: [],
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
    hasDiagram: {
      type: Boolean,
      default: false,
    },
    hasLatex: {
      type: Boolean,
      default: false,
    },
    reviewReason: {
      type: String,
      default: null,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    year: {
      type: Number,
      default: null, // For past paper MCQs — e.g. 2023
    },
    isPastPaper: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      default: null,
    },
    questionNumber: {
      type: String,
      default: null,
      trim: true,
    },
    originalQuestionNumber: {
      type: String,
      default: null,
      trim: true,
    },
    originalQuestionNumberSort: {
      type: Number,
      default: null,
    },
    csvRowIndex: {
      type: Number,
      default: null,
    },
    importBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImportBatch',
      default: null,
    },
    importStatus: {
      type: String,
      enum: ['imported', 'review', 'pending', 'fixed', 'rejected'],
      default: 'imported',
    },
    validationErrors: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
)

// ==================== INDEXES ====================
mcqSchema.index({ courseId: 1, topic: 1, isPublished: 1 })
mcqSchema.index({ courseId: 1, difficulty: 1 })
mcqSchema.index({ courseId: 1, isPastPaper: 1, year: 1 })
mcqSchema.index({ courseId: 1, subject: 1, chapterId: 1, isPublished: 1 })
mcqSchema.index({ courseId: 1, chapterId: 1, topicId: 1, isPublished: 1 })
mcqSchema.index({ subject: 1 })
mcqSchema.index({
  courseId: 1,
  chapterId: 1,
  topicId: 1,
  originalQuestionNumberSort: 1,
  csvRowIndex: 1,
  createdAt: 1,
})
mcqSchema.index({ importBatchId: 1, csvRowIndex: 1 })

module.exports = mongoose.model('MCQ', mcqSchema)
