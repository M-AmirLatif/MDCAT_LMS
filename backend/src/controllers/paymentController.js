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
    const payments = await Payment.find({ studentId: req.user.id })
      .populate('courseId', 'name category')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
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
