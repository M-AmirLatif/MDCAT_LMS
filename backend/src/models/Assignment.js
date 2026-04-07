const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    textAnswer: {
      type: String,
      default: null,
    },
    marks: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false },
)

const assignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide assignment title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],
    dueDate: {
      type: Date,
      default: null,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submissions: {
      type: [submissionSchema],
      default: [],
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Assignment', assignmentSchema)
