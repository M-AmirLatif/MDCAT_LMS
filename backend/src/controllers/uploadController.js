const path = require('path')
const fs = require('fs')
const multer = require('multer')

const storageDriver = (process.env.STORAGE_DRIVER || 'local').toLowerCase()
const isS3 = storageDriver === 's3'

const sanitizeName = (name) =>
  name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase()

let upload

if (isS3) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

  const region = process.env.AWS_REGION
  const bucket = process.env.AWS_S3_BUCKET
  const baseUrl = process.env.AWS_S3_BASE_URL

  const s3 = new S3Client({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  })

  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 },
  })

  exports.uploadSingleMiddleware = upload.single('file')

  exports.uploadSingle = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }
      if (!region || !bucket) {
        return res.status(500).json({
          error: 'S3 configuration missing: AWS_REGION or AWS_S3_BUCKET',
        })
      }

      const ext = path.extname(req.file.originalname)
      const base = sanitizeName(path.basename(req.file.originalname, ext))
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      const key = `uploads/${base || 'file'}-${unique}${ext}`

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }),
      )

      const fileUrl =
        baseUrl && baseUrl.trim().length > 0
          ? `${baseUrl.replace(/\/+$/, '')}/${key}`
          : `https://${bucket}.s3.${region}.amazonaws.com/${key}`

      res.status(200).json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
} else {
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

  upload = multer({
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
}
