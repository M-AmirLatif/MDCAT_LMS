import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import { getUserProfilePicture, normalizeProfilePictureForStorage } from '../utils/assetUrl'
import './PlatformPages.css'

const safeText = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return fallback
  return String(value)
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M4 8h3l1.5-2h7L17 8h3v10H4V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

const fileToProfileDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Please select an image file.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read selected image.'))
    reader.onload = () => {
      const originalDataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!originalDataUrl) {
        reject(new Error('Could not read selected image.'))
        return
      }

      const image = new Image()
      image.onerror = () => resolve(originalDataUrl)
      image.onload = () => {
        const maxSize = 512
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) {
          resolve(originalDataUrl)
          return
        }
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.86))
      }
      image.src = originalDataUrl
    }
    reader.readAsDataURL(file)
  })

export default function PlatformProfile() {
  const auth = useAuth()
  const user = auth?.user || null
  const updateUser = typeof auth?.updateUser === 'function' ? auth.updateUser : () => {}
  const fileInputRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [photoRetry, setPhotoRetry] = useState(0)
  const [preferences, setPreferences] = useState({
    pushReminders: true,
    emailSummaries: true,
    profileVisibility: false,
  })

  const buildFormFromUser = (sourceUser = user) => ({
    firstName: safeText(sourceUser?.firstName),
    lastName: safeText(sourceUser?.lastName),
    email: safeText(sourceUser?.email, 'student@mdcat.pk'),
    phone: safeText(sourceUser?.phone, '+92 300 1234567'),
    city: 'Lahore',
    target: 'King Edward Medical University',
    profilePicture: getUserProfilePicture(sourceUser),
  })

  const [form, setForm] = useState(() => buildFormFromUser(user))

  useEffect(() => {
    setPhotoError(false)
    setPhotoRetry(0)
    setForm((current) => ({
      ...current,
      firstName: safeText(user?.firstName),
      lastName: safeText(user?.lastName),
      email: safeText(user?.email, 'student@mdcat.pk'),
      phone: safeText(user?.phone, '+92 300 1234567'),
      profilePicture: getUserProfilePicture(user),
    }))
  }, [user])

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    toast.success('Preference updated successfully.')
  }

  const initials = `${form.firstName?.[0] || 'U'}${form.lastName?.[0] || ''}`.toUpperCase()
  const displayName = useMemo(
    () => `${form.firstName || ''} ${form.lastName || ''}`.trim() || 'MDCAT User',
    [form.firstName, form.lastName],
  )

  const onFieldChange = (event) => {
    const { id, value } = event.target
    setForm((current) => ({ ...current, [id]: value }))
  }

  const onUploadClick = () => fileInputRef.current?.click()

  const onPhotoSelected = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const storedProfilePicture = await fileToProfileDataUrl(file)
      const profileRes = await API.put('/auth/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        profilePicture: storedProfilePicture,
      })

      const nextUser = profileRes.data.user
      updateUser(nextUser)
      setPhotoError(false)
      setPhotoRetry(0)
      setForm((current) => ({
        ...current,
        profilePicture: getUserProfilePicture(nextUser) || storedProfilePicture,
      }))
      toast.success('Profile photo updated.')
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not update the profile photo right now.'))
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      const res = await API.put('/auth/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        profilePicture: normalizeProfilePictureForStorage(form.profilePicture) || null,
      })
      updateUser(res.data.user)
      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not update the profile right now.'))
    } finally {
      setSaving(false)
    }
  }

  const discardChanges = () => {
    setPhotoError(false)
    setPhotoRetry(0)
    setForm(buildFormFromUser(user))
  }

  const displayProfilePicture = useMemo(() => {
    const currentPicture = safeText(form.profilePicture).trim()
    if (!currentPicture) return ''
    if (!photoRetry) return currentPicture
    const separator = currentPicture.includes('?') ? '&' : '?'
    return `${currentPicture}${separator}retry=${photoRetry}`
  }, [form.profilePicture, photoRetry])

  const handlePhotoError = () => {
    if (safeText(form.profilePicture).trim() && photoRetry < 1) {
      setPhotoRetry((current) => current + 1)
      return
    }
    setPhotoError(true)
  }

  const showProfilePhoto = Boolean(safeText(form.profilePicture).trim() && !photoError)

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Profile</div>
            <h2 className="workspace-card-title">Edit your account</h2>
            <p>Manage personal details, exam goals, and account preferences.</p>
          </div>
          <span className="sync-pill">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
              <path d="M20 12a8 8 0 0 0-14.9-4M4 12a8 8 0 0 0 14.9 4M4 4v4h4m8 8h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Saved changes sync instantly
          </span>
        </div>
      </section>

      <div className="split-layout">
        <div className="workspace-card">
          <div className="workspace-card-body form-shell profile-form">
            <div className="avatar-editor avatar-editor--profile">
              <div className="avatar-stack">
                {showProfilePhoto ? (
                  <img
                    className="avatar-circle avatar-circle--image"
                    src={displayProfilePicture}
                    alt={displayName}
                    onError={handlePhotoError}
                    onLoad={() => setPhotoError(false)}
                  />
                ) : (
                  <div className="avatar-circle">{initials}</div>
                )}
                <button className="avatar-camera" type="button" onClick={onUploadClick} aria-label="Upload profile photo">
                  <CameraIcon />
                </button>
              </div>

              <div className="profile-hero-copy">
                <h3 className="workspace-card-title">{displayName}</h3>
                <p>{form.email}</p>
                <div className="profile-hero-actions">
                  <button className="btn btn-secondary profile-upload-btn" type="button" onClick={onUploadClick} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload New Photo'}
                  </button>
                  {showProfilePhoto ? (
                    <a className="btn btn-secondary profile-view-photo-btn" href={displayProfilePicture || safeText(form.profilePicture)} target="_blank" rel="noreferrer">
                      View Photo
                    </a>
                  ) : null}
                </div>
                {form.profilePicture && photoError ? (
                  <p className="profile-photo-warning">Saved photo could not be loaded. Upload a new photo to replace it.</p>
                ) : null}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={onPhotoSelected} hidden />
            </div>

            <div className="floating-grid">
              <div className="floating-field"><label htmlFor="firstName">First name</label><input id="firstName" type="text" value={form.firstName} onChange={onFieldChange} /></div>
              <div className="floating-field"><label htmlFor="lastName">Last name</label><input id="lastName" type="text" value={form.lastName} onChange={onFieldChange} /></div>
              <div className="floating-field"><label htmlFor="email">Email</label><input id="email" type="email" value={form.email} onChange={onFieldChange} disabled /></div>
              <div className="floating-field"><label htmlFor="phone">Phone</label><input id="phone" type="tel" value={form.phone} onChange={onFieldChange} /></div>
              <div className="floating-field"><label htmlFor="city">City</label><input id="city" type="text" value={form.city} onChange={onFieldChange} /></div>
              <div className="floating-field"><label htmlFor="target">Target College</label><input id="target" type="text" value={form.target} onChange={onFieldChange} /></div>
            </div>

            <div className="inline-actions">
              <button className="btn btn-primary" type="button" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button className="btn btn-secondary" type="button" onClick={discardChanges}>Discard</button>
            </div>
          </div>
        </div>

        <aside className="workspace-card drawer-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Preferences</div>
              <h3 className="workspace-card-title">Notifications and privacy</h3>
            </div>
          </div>
          <div className="workspace-card-body">
            <div className="toggle-row" onClick={() => togglePreference('pushReminders')} style={{ cursor: 'pointer' }}>
              <div>
                <strong>Push reminders</strong>
                <p>Get live class alerts and test nudges.</p>
              </div>
              <span className={`toggle ${preferences.pushReminders ? 'toggle--on' : ''}`} />
            </div>
            <div className="toggle-row" onClick={() => togglePreference('emailSummaries')} style={{ cursor: 'pointer' }}>
              <div>
                <strong>Email summaries</strong>
                <p>Weekly progress and invoice summaries.</p>
              </div>
              <span className={`toggle ${preferences.emailSummaries ? 'toggle--on' : ''}`} />
            </div>
            <div className="toggle-row" onClick={() => togglePreference('profileVisibility')} style={{ cursor: 'pointer' }}>
              <div>
                <strong>Profile visibility</strong>
                <p>Show your progress to assigned teachers.</p>
              </div>
              <span className={`toggle ${preferences.profileVisibility ? 'toggle--on' : ''}`} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}






