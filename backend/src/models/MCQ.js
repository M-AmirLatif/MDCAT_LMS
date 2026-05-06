const mongoose = require('mongoose')

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
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
    question: {
      type: String,
      required: [true, 'Please provide question'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: [
        (value) => Array.isArray(value) && value.length >= 2,
        'At least two options are required',
      ],
    },
    explanation: {
      type: String,
      default: null,
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
  },
  { timestamps: true },
)

// ==================== INDEXES ====================
mcqSchema.index({ courseId: 1, topic: 1, isPublished: 1 })
mcqSchema.index({ courseId: 1, difficulty: 1 })
mcqSchema.index({ courseId: 1, isPastPaper: 1, year: 1 })
mcqSchema.index({ courseId: 1, subject: 1, chapterId: 1, isPublished: 1 })
mcqSchema.index({ subject: 1 })

module.exports = mongoose.model('MCQ', mcqSchema)
