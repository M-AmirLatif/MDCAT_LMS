const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide course name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide course description'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: [
        'Biology',
        'Chemistry',
        'Physics',
        'English',
        'Urdu',
        'Islamic Studies',
      ],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    topics: [
      {
        name: {
          type: String,
          required: true,
        },
        description: String,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

// Auto-generate slug from name
courseSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-')
  }
  next()
})

module.exports = mongoose.model('Course', courseSchema)
