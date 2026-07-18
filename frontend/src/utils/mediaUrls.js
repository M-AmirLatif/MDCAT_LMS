import { API_BASE_URL } from '../services/api'

const IMAGE_URL_KEYS = [
  'secure_url',
  'secureUrl',
  'url',
  'src',
  'imageUrl',
  'fileUrl',
  'absoluteUrl',
  'publicUrl',
  'location',
  'path',
  'href',
]

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
}

function extractImageValue(input, depth = 0) {
  if (!input || depth > 3) return ''
  if (typeof input === 'string') return input
  if (Array.isArray(input)) {
    for (const item of input) {
      const value = extractImageValue(item, depth + 1)
      if (value) return value
    }
    return ''
  }
  if (typeof input === 'object') {
    for (const key of IMAGE_URL_KEYS) {
      const value = extractImageValue(input[key], depth + 1)
      if (value) return value
    }
  }
  return ''
}

export function cleanImageUrlValue(input) {
  let value = extractImageValue(input)
    .trim()
    .replace(/^[\"'`<]+|[\"'`>]+$/g, '')
  if (!value) return ''

  const markdownMatch = value.match(/^!\[[^\]]*]\(([\s\S]+)\)$/)
  if (markdownMatch?.[1]) value = markdownMatch[1].trim()

  const tokenMatch = value.match(/^\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):\s*([\s\S]*?)\]$/i)
  if (tokenMatch?.[1]) value = tokenMatch[1].trim()

  const pipeIndex = value.indexOf('|')
  if (pipeIndex > -1) {
    const beforePipe = value.slice(0, pipeIndex).trim()
    if (/^(?:https?:|\/\/|\/?uploads\/|\/?api\/uploads\/|data:image\/|blob:)/i.test(beforePipe)) {
      value = beforePipe
    }
  }

  value = value
    .trim()
    .replace(/^[\"'`<]+|[\"'`>]+$/g, '')

  if (!/^(data:image\/|blob:)/i.test(value)) {
    value = value.replace(/[),.;\]]+$/g, '')
  }

  return value
}

export function normalizeImageUrl(input) {
  let value = cleanImageUrlValue(input)
  if (!value) return ''

  if (/^(data:image\/|blob:)/i.test(value)) return value
  if (/^\/\//.test(value)) value = `https:${value}`

  value = value.replace(/\\/g, '/')

  const apiOrigin = getApiOrigin()
  const isLocalImageHost = (hostname) => (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  )

  const normalizeUploadPath = (pathname) => {
    const path = String(pathname || '').replace(/\\/g, '/')
    if (/^\/?api\/uploads\//i.test(path)) {
      return `/${path.replace(/^\/?api\/uploads\//i, 'uploads/')}`
    }
    if (/^\/?uploads\//i.test(path)) {
      return path.startsWith('/') ? path : `/${path}`
    }
    return ''
  }

  const directUploadPath = normalizeUploadPath(value)
  if (directUploadPath) {
    return apiOrigin ? `${apiOrigin}${directUploadPath}` : directUploadPath
  }

  try {
    const parsed = new URL(value)
    const uploadPath = normalizeUploadPath(parsed.pathname)
    const isLocalHost = isLocalImageHost(parsed.hostname)
    const isFrontendUploadUrl = typeof window !== 'undefined' && (
      parsed.origin === window.location.origin ||
      parsed.hostname.endsWith('vercel.app') ||
      isLocalHost
    )
    if (uploadPath && apiOrigin && isFrontendUploadUrl) {
      return `${apiOrigin}${uploadPath}${parsed.search}${parsed.hash}`
    }
    if (parsed.protocol === 'http:' && !isLocalHost) {
      parsed.protocol = 'https:'
    }
    return parsed.toString()
  } catch {
    return value.replace(/\s/g, '%20')
  }
}



