const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Please provide a slug'],
      unique: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide blog content'],
    },
    excerpt: {
      type: String,
      trim: true,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    tags: [String],
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

module.exports = mongoose.model('Blog', blogSchema)

