const mongoose = require('mongoose')

const flashcardSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mcqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MCQ',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      enum: ['Biology', 'Chemistry', 'Physics', 'English'],
    },
    chapterId: {
      type: String,
      required: true,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
    },
    interval: {
      type: Number,
      default: 0,
    },
    repetitions: {
      type: Number,
      default: 0,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

flashcardSchema.index({ studentId: 1, mcqId: 1 }, { unique: true })

module.exports = mongoose.model('Flashcard', flashcardSchema)
