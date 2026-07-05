import { API_BASE_URL } from '../services/api'

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
}

export function normalizeImageUrl(url) {
  const value = String(url || '').trim()
  if (!value) return ''

  if (/^data:image\//i.test(value)) return value

  const apiOrigin = getApiOrigin()

  if (/^\/uploads\//i.test(value)) {
    return apiOrigin ? `${apiOrigin}${value}` : value
  }

  try {
    const parsed = new URL(value)
    if (parsed.pathname.startsWith('/uploads/') && apiOrigin) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}`
    }
    return value
  } catch {
    return value
  }
}
