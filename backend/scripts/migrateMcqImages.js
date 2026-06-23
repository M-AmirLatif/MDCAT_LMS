require('dotenv').config()
const mongoose = require('mongoose')
const MCQ = require('../src/models/MCQ')

const IMAGE_TOKEN_REGEX = /\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):\s*([\s\S]*?)\]/gi
const MARKDOWN_IMAGE_REGEX = /!\[([\s\S]*?)\]\(([\s\S]*?)\)/gi
const HTML_IMAGE_TAG_REGEX = /<img\b[^>]*>/gi
const IMAGE_SOURCE_REGEX = /\bsrc\s*=\s*["']([^"']+)["']/i
const IMAGE_URL_REGEX =
  /((?:(?:https?:\/\/)[^\s<>"']+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?)|(?:https?:\/\/res\.cloudinary\.com\/[^\s<>"']*?\/image\/upload\/[^\s<>"']+)|(?:\/uploads\/[^\s<>"']+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?)|(?:data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+))/gi

const cleanImageUrl = (value) =>
  String(value || '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[),.;\]]+$/g, '')

const isImageUrl = (value) => {
  const url = cleanImageUrl(value)
  if (!url) return false
  if (/^\/uploads\//i.test(url) || /^data:image\//i.test(url)) return true
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    return parsed.hostname.includes('cloudinary.com') ||
      /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(parsed.pathname)
  } catch {
    return false
  }
}

const uniqueImages = (...values) => {
  const out = []
  const push = (value) => {
    if (!value) return
    if (Array.isArray(value)) return value.forEach(push)
    const url = cleanImageUrl(value)
    if (isImageUrl(url)) out.push(url)
  }
  values.forEach(push)
  return [...new Set(out)]
}

const extract = (value, existing = []) => {
  let text = String(value || '')
  const images = []
  const add = (url) => {
    if (isImageUrl(url)) images.push(cleanImageUrl(url))
  }
  text = text.replace(HTML_IMAGE_TAG_REGEX, (tag) => {
    const match = tag.match(IMAGE_SOURCE_REGEX)
    if (match?.[1]) add(match[1])
    return ''
  })
  text = text.replace(MARKDOWN_IMAGE_REGEX, (_, alt, url) => {
    add(url)
    return alt || ''
  })
  text = text.replace(IMAGE_TOKEN_REGEX, (_, body) => {
    add(String(body || '').split('|')[0])
    return ''
  })
  text = text.replace(IMAGE_URL_REGEX, (url) => {
    add(url)
    return ''
  })
  return {
    text: text.replace(/\n{3,}/g, '\n\n').trim(),
    images: uniqueImages(existing, images),
  }
}

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!uri) throw new Error('Missing MONGO_URI/MONGODB_URI')
  await mongoose.connect(uri)

  const mcqs = await MCQ.find({})
  let changed = 0
  for (const mcq of mcqs) {
    const q = extract(mcq.questionText || mcq.question, mcq.questionImages)
    const e = extract(mcq.explanationText || mcq.explanation, mcq.explanationImages)
    const optionMedia = ['A', 'B', 'C', 'D'].map((letter, index) =>
      extract(mcq[`option${letter}`] || mcq.options?.[index]?.text, mcq[`option${letter}Images`] || mcq.options?.[index]?.images),
    )

    mcq.question = q.text
    mcq.questionText = q.text
    mcq.questionImages = q.images
    mcq.explanation = e.text || null
    mcq.explanationText = e.text
    mcq.explanationImages = e.images
    mcq.options = (mcq.options || []).map((option, index) => ({
      ...option.toObject?.() || option,
      text: optionMedia[index]?.text || option.text,
      images: optionMedia[index]?.images || [],
    }))
    ;['A', 'B', 'C', 'D'].forEach((letter, index) => {
      mcq[`option${letter}`] = optionMedia[index]?.text || ''
      mcq[`option${letter}Images`] = optionMedia[index]?.images || []
    })
    await mcq.save()
    changed += 1
  }

  console.log(`Migrated MCQs: ${changed}`)
  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error.message)
  await mongoose.disconnect()
  process.exit(1)
})
