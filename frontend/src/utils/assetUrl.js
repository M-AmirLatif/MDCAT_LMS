import { API_BASE_URL } from '../services/api'

const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
})()

export function getUploadPath(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  if (raw.startsWith('/uploads/')) return raw
  try {
    const parsed = new URL(raw)
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search || ''}`
    }
  } catch {
    // Non-URL values are handled by resolveAssetUrl.
  }
  return ''
}

export function normalizeProfilePictureForStorage(value) {
  const uploadPath = getUploadPath(value)
  return uploadPath || (typeof value === 'string' ? value.trim() : '')
}

export function resolveAssetUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''

  const uploadPath = getUploadPath(raw)
  if (uploadPath) return API_ORIGIN ? `${API_ORIGIN}${uploadPath}` : uploadPath

  if (/^(https?:|data:|blob:)/i.test(raw)) return raw
  return raw
}

export function getUserProfilePicture(user) {
  return resolveAssetUrl(
    user?.profilePicture ||
      user?.profileImage ||
      user?.profileImageUrl ||
      user?.avatar ||
      user?.photo ||
      '',
  )
}