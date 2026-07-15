const path = require('path')
const fs = require('fs')
const multer = require('multer')
const Upload = require('../models/Upload')

const uploadDir = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-')
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${base}-${unique}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for MCQ uploads'))
    }
    cb(null, true)
  },
})

const buildUploadUrl = (req, filename) => {
  const publicBase = String(process.env.PUBLIC_API_BASE_URL || process.env.API_PUBLIC_URL || '').trim().replace(/\/+$/, '')
  if (publicBase) return `${publicBase}/uploads/${filename}`
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`
}

exports.uploadSingleMiddleware = upload.single('file')

exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const data = await fs.promises.readFile(req.file.path)
    await Upload.findOneAndUpdate(
      { filename: req.file.filename },
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        data,
        uploadedBy: req.user?._id || null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    const fileUrl = buildUploadUrl(req, req.file.filename)
    res.status(200).json({
      success: true,
      fileUrl,
      url: fileUrl,
      fileName: req.file.originalname,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.serveUpload = async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename || '')
    if (!filename) return next()

    const upload = await Upload.findOne({ filename }).lean()
    if (!upload?.data) return next()

    res.setHeader('Content-Type', upload.contentType || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
    res.send(upload.data)
  } catch (error) {
    next(error)
  }
}

