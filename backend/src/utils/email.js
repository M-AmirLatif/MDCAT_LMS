const nodemailer = require('nodemailer')

const createTransporter = () => {
  const {
    SMTP_SERVICE,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env

  if (!SMTP_USER || !SMTP_PASS || (!SMTP_SERVICE && !SMTP_HOST)) {
    return null
  }

  if (SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: SMTP_SERVICE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
}

const transporter = createTransporter()

const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    throw new Error('Email service not configured')
  }

  const from = process.env.SMTP_FROM || 'MDCAT LMS <no-reply@mdcat-lms.com>'

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  })
}

const sendOtpEmail = async ({ to, name, otp }) => {
  const subject = 'Verify your MDCAT LMS account'
  const text = `Hi ${name || 'there'},\n\nYour OTP is ${otp}.\nIt expires in 10 minutes.\n\nMDCAT LMS`
  const html = `<p>Hi ${name || 'there'},</p><p>Your OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p><p>MDCAT LMS</p>`
  return sendEmail({ to, subject, text, html })
}

module.exports = { sendOtpEmail, sendEmail }
