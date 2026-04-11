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
      enum: ['Biology', 'Chemistry', 'Physics', 'English'],
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
    price: {
      type: Number,
      default: 0, // 0 means free
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    thumbnail: {
      type: String,
      default: null,
    },
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

// ==================== INDEXES ====================
courseSchema.index({ category: 1, isPublished: 1 })
courseSchema.index({ createdBy: 1 })
courseSchema.index({ name: 'text', description: 'text' })

module.exports = mongoose.model('Course', courseSchema)
