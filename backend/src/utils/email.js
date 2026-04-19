const nodemailer = require('nodemailer')
const https = require('https')

const SMTP_TIMEOUTS = {
  // Keep API requests responsive even if SMTP is slow/unreachable.
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000),
}

const resendApiKey = process.env.RESEND_API_KEY

const stripWrappingQuotes = (value) => {
  if (!value) return value
  const trimmed = String(value).trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

const normalizeFrom = (value) => {
  const stripped = stripWrappingQuotes(value)
  if (!stripped) return stripped
  // Tolerate accidental whitespace around angle-bracket address in env vars.
  return String(stripped)
    .trim()
    .replace(/\s+</g, ' <')
    .replace(/<\s+/g, '<')
    .replace(/\s+>/g, '>')
}

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

const getEmailStatus = () => {
  const from =
    normalizeFrom(process.env.SMTP_FROM) ||
    (resendApiKey ? 'MDCAT LMS <onboarding@resend.dev>' : 'MDCAT LMS <no-reply@mdcat-lms.com>')

  const smtpConfigured = Boolean(transporter)
  const resendConfigured = Boolean(resendApiKey)
  const provider = resendConfigured ? 'resend' : smtpConfigured ? 'smtp' : 'none'

  return {
    provider,
    from,
    resendConfigured,
    smtpConfigured,
    smtpService: process.env.SMTP_SERVICE || null,
    smtpHost: process.env.SMTP_HOST || null,
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
    smtpSecure: process.env.SMTP_SECURE ? String(process.env.SMTP_SECURE).toLowerCase() === 'true' : null,
  }
}

const sendEmailViaResend = async ({ to, subject, text, html }) => {
  if (!resendApiKey) {
    throw new Error('Email service not configured')
  }

  const from = normalizeFrom(process.env.SMTP_FROM) || 'MDCAT LMS <onboarding@resend.dev>'
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  }

  const timeoutMs = Number(process.env.RESEND_TIMEOUT_MS || 10000)
  const body = JSON.stringify(payload)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          const status = res.statusCode || 0
          const data = raw ? JSON.parse(raw) : {}

          if (status < 200 || status >= 300) {
            const message =
              data?.message || data?.error || `Resend error (${status})`
            const err = new Error(message)
            err.code = 'RESEND_ERROR'
            err.responseCode = status
            err.details = data
            return reject(err)
          }

          return resolve(data)
        })
      },
    )

    req.on('error', (err) => reject(err))
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Resend timeout after ${timeoutMs}ms`))
    })

    req.write(body)
    req.end()
  })
}

const sendEmail = async ({ to, subject, text, html }) => {
  // Prefer HTTPS email API when configured (works on hosts that block SMTP egress).
  if (resendApiKey) {
    return sendEmailViaResend({ to, subject, text, html })
  }

  if (!transporter) throw new Error('Email service not configured')

  const from = normalizeFrom(process.env.SMTP_FROM) || 'MDCAT LMS <no-reply@mdcat-lms.com>'

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

module.exports = { sendOtpEmail, sendEmail, getEmailStatus }
