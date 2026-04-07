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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('MCQ', mcqSchema)
