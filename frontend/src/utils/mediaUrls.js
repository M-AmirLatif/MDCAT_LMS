import { API_BASE_URL } from '../services/api'

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
}

export function normalizeImageUrl(url) {
  const value = String(url || '')
    .trim()
    .replace(/^[\"'`<]+|[\"'`>]+$/g, '')
  if (!value) return ''

  if (/^(data:image\/|blob:)/i.test(value)) return value

  const apiOrigin = getApiOrigin()

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
    if (uploadPath && apiOrigin) {
      return `${apiOrigin}${uploadPath}${parsed.search}`
    }
    return value
  } catch {
    return value
  }
}
