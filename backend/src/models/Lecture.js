const mongoose = require('mongoose')

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide lecture title'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Please provide video URL'],
    },
    videoDuration: {
      type: Number, // in seconds
      default: 0,
    },
    notes: {
      type: String,
      default: null,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    ratings: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Lecture', lectureSchema)
