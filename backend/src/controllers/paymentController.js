const Payment = require('../models/Payment')

// ==================== CREATE PAYMENT (Student) ====================
exports.createPayment = async (req, res) => {
  try {
    const { courseId, amount, currency, paymentMethod } = req.body

    if (!courseId || !amount) {
      return res.status(400).json({ error: 'courseId and amount are required' })
    }

    const payment = await Payment.create({
      studentId: req.user.id,
      courseId,
      amount: Number(amount),
      currency: currency || 'PKR',
      paymentMethod: paymentMethod || 'manual',
      status: 'pending',
    })

    res.status(201).json({
      success: true,
      message: 'Payment created',
      payment,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET MY PAYMENTS ====================
exports.getMyPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const skip = (page - 1) * limit

    const filter = { studentId: req.user.id }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('courseId', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE PAYMENT STATUS (Admin) ====================
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId } = req.body

    const payment = await Payment.findById(req.params.paymentId)
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    if (status) {
      payment.status = status
    }
    if (transactionId) {
      payment.transactionId = transactionId
    }

    await payment.save()

    res.status(200).json({
      success: true,
      message: 'Payment updated',
      payment,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
