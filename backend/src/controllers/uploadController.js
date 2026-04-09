const path = require('path')
const fs = require('fs')
const multer = require('multer')

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
  limits: { fileSize: 200 * 1024 * 1024 },
})

exports.uploadSingleMiddleware = upload.single('file')

exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    res.status(200).json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
