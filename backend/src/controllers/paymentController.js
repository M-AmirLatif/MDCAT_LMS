const path = require('path')
const fs = require('fs')
const multer = require('multer')
const PaymentRequest = require('../models/PaymentRequest')
const User = require('../models/User')
const {
  SUBJECT_FEE,
  SUBJECTS,
  normalizeSubjects,
  upsertSubjectSubscriptions,
} = require('../utils/subscriptions')

const PAYMENT_METHODS = [
  {
    id: 'JazzCash',
    name: 'JazzCash',
    number: '03006575463',
    accountName: 'Muhammad Shafiq',
  },
  {
    id: 'Easypaisa',
    name: 'Easypaisa',
    number: '03350631487',
    accountName: 'Muhammad Amir',
  },
]

const uploadDir = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-')
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `payment-${base}-${unique}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\//i.test(file.mimetype)) {
      return cb(new Error('Only image screenshots are allowed'))
    }
    cb(null, true)
  },
})

exports.uploadPaymentScreenshot = upload.single('screenshot')

const serializeRequest = (request) => request

exports.getPaymentMethods = async (req, res) => {
  res.status(200).json({
    success: true,
    subjectFee: SUBJECT_FEE,
    subjects: SUBJECTS,
    methods: PAYMENT_METHODS,
  })
}

exports.submitPaymentRequest = async (req, res) => {
  try {
    const selectedSubjects = normalizeSubjects(
      Array.isArray(req.body.selectedSubjects)
        ? req.body.selectedSubjects
        : String(req.body.selectedSubjects || '').split(','),
    )
    const paymentMethod = String(req.body.paymentMethod || '').trim()
    const transactionId = String(req.body.transactionId || '').trim()

    if (!selectedSubjects.length) {
      return res.status(400).json({ error: 'Please select at least one subject' })
    }

    if (!PAYMENT_METHODS.some((method) => method.id === paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' })
    }

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID/reference number is required' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' })
    }

    const amount = selectedSubjects.length * SUBJECT_FEE
    const screenshotUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`

    const paymentRequest = await PaymentRequest.create({
      studentId: req.user.id,
      selectedSubjects,
      amount,
      paymentMethod,
      transactionId,
      screenshotUrl,
      status: 'pending',
    })

    res.status(201).json({
      success: true,
      message: 'Payment request submitted for admin review',
      paymentRequest,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getMyPaymentRequests = async (req, res) => {
  try {
    const requests = await PaymentRequest.find({ studentId: req.user.id })
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
      payments: requests,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getMySubscriptions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('subscriptions')
      .lean()
    const now = new Date()
    const subscriptions = (user?.subscriptions || []).map((subscription) => ({
      ...subscription,
      active: subscription.endDate && new Date(subscription.endDate) >= now,
    }))

    res.status(200).json({
      success: true,
      subscriptions,
      activeSubjects: subscriptions
        .filter((subscription) => subscription.active)
        .map((subscription) => subscription.subjectId),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getPendingPaymentRequests = async (req, res) => {
  try {
    const requests = await PaymentRequest.find({ status: 'pending' })
      .populate('studentId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({ success: true, count: requests.length, requests })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAllPaymentRequests = async (req, res) => {
  try {
    const status = String(req.query.status || '').trim()
    const filter = ['pending', 'approved', 'rejected'].includes(status)
      ? { status }
      : {}

    const requests = await PaymentRequest.find(filter)
      .populate('studentId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({ success: true, count: requests.length, requests })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.approvePaymentRequest = async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findById(req.params.id)
    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' })
    }

    if (paymentRequest.status === 'approved') {
      return res.status(200).json({
        success: true,
        message: 'Payment request already approved',
        paymentRequest: serializeRequest(paymentRequest),
      })
    }

    const student = await User.findById(paymentRequest.studentId)
    if (!student) return res.status(404).json({ error: 'Student not found' })

    const approvedAt = new Date()
    // Important: subject subscriptions are updated only when admin approves.
    upsertSubjectSubscriptions(
      student,
      paymentRequest.selectedSubjects,
      paymentRequest._id,
      approvedAt,
    )
    student.subscriptionPlan = 'monthly'
    student.subscriptionStatus = 'active'
    student.subscriptionStartDate = approvedAt
    student.subscriptionEndDate = student.subscriptions.reduce((latest, subscription) => {
      const endDate = subscription.endDate ? new Date(subscription.endDate) : null
      return endDate && (!latest || endDate > latest) ? endDate : latest
    }, null)

    paymentRequest.status = 'approved'
    paymentRequest.approvedAt = approvedAt
    paymentRequest.rejectedAt = null
    paymentRequest.adminNote = String(req.body.adminNote || paymentRequest.adminNote || '').trim()

    await Promise.all([student.save(), paymentRequest.save()])

    res.status(200).json({
      success: true,
      message: 'Payment approved and subscription activated',
      paymentRequest,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.rejectPaymentRequest = async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findById(req.params.id)
    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' })
    }

    if (paymentRequest.status === 'approved') {
      return res.status(400).json({ error: 'Approved payment requests cannot be rejected' })
    }

    paymentRequest.status = 'rejected'
    paymentRequest.rejectedAt = new Date()
    paymentRequest.adminNote = String(req.body.adminNote || '').trim()
    await paymentRequest.save()

    res.status(200).json({
      success: true,
      message: 'Payment request rejected',
      paymentRequest,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
