import { API_BASE_URL } from '../services/api'

const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
})()

export function resolveAssetUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw
  if (raw.startsWith('/uploads/')) return `${API_ORIGIN}${raw}`
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
