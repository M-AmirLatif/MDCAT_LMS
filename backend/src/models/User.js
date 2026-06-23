const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    // If false, the user was created via Google and still needs to set a local password
    // to use email+password login.
    hasLocalPassword: {
      type: Boolean,
      default: true,
    },
    activeSessionId: { type: String, default: null, select: false },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailOtpHash: {
      type: String,
      select: false,
      default: null,
    },
    emailOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },
    phone: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'monthly', 'quarterly', 'premium', 'enterprise'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'pending', 'active', 'expired', 'cancelled'],
      default: 'none',
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected', 'restricted'],
      default: 'active',
    },
    assignedSubject: {
      type: String,
      enum: ['Biology', 'Chemistry', 'Physics', 'English', null],
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    accessStatus: {
      type: String,
      enum: ['active', 'restricted', 'expired'],
      default: 'active',
    },
    subscriptions: [
      {
        subjectId: {
          type: String,
          enum: ['Biology', 'Chemistry', 'Physics', 'English'],
          required: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        paymentRequestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PaymentRequest',
          required: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

// ==================== HASH PASSWORD BEFORE SAVE ====================
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// ==================== COMPARE PASSWORD METHOD ====================
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// ==================== INDEXES ====================
userSchema.index({ email: 1 })
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ role: 1, status: 1, assignedSubject: 1 })
userSchema.index({ 'subscriptions.subjectId': 1, 'subscriptions.endDate': 1 })

module.exports = mongoose.model('User', userSchema)
