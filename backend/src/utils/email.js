const nodemailer = require('nodemailer')

const SMTP_TIMEOUTS = {
  // Keep API requests responsive even if SMTP is slow/unreachable.
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000),
}

const resendApiKey = process.env.RESEND_API_KEY

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
      ...SMTP_TIMEOUTS,
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
    ...SMTP_TIMEOUTS,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
}

const transporter = createTransporter()

const sendEmailViaResend = async ({ to, subject, text, html }) => {
  if (!resendApiKey) {
    throw new Error('Email service not configured')
  }

  const from = process.env.SMTP_FROM || 'MDCAT LMS <onboarding@resend.dev>'
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  }

  const controller = new AbortController()
  const timeoutMs = Number(process.env.RESEND_TIMEOUT_MS || 10000)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message =
        data?.message || data?.error || `Resend error (${response.status})`
      const err = new Error(message)
      err.code = 'RESEND_ERROR'
      err.responseCode = response.status
      err.details = data
      throw err
    }

    return data
  } finally {
    clearTimeout(timeout)
  }
}

const sendEmail = async ({ to, subject, text, html }) => {
  // Prefer HTTPS email API when configured (works on hosts that block SMTP egress).
  if (resendApiKey) {
    return sendEmailViaResend({ to, subject, text, html })
  }

  if (!transporter) throw new Error('Email service not configured')

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
