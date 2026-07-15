import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import { getUserProfilePicture, normalizeProfilePictureForStorage, resolveAssetUrl } from '../utils/assetUrl'
import './PlatformPages.css'

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M4 8h3l1.5-2h7L17 8h3v10H4V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export default function PlatformProfile() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [preferences, setPreferences] = useState({
    pushReminders: true,
    emailSummaries: true,
    profileVisibility: false,
  })

  const buildFormFromUser = (sourceUser = user) => ({
    firstName: sourceUser?.firstName || '',
    lastName: sourceUser?.lastName || '',
    email: sourceUser?.email || 'student@mdcat.pk',
    phone: sourceUser?.phone || '+92 300 1234567',
    city: 'Lahore',
    target: 'King Edward Medical University',
    profilePicture: getUserProfilePicture(sourceUser),
  })

  const [form, setForm] = useState(() => buildFormFromUser(user))

  useEffect(() => {
    setPhotoError(false)
    setForm((current) => ({
      ...current,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || 'student@mdcat.pk',
      phone: user?.phone || '+92 300 1234567',
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

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      const uploadRes = await API.post('/uploads/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const storedProfilePicture = normalizeProfilePictureForStorage(uploadRes.data.fileUrl || uploadRes.data.url)
      const profilePicture = resolveAssetUrl(storedProfilePicture)
      const profileRes = await API.put('/auth/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        profilePicture: storedProfilePicture,
      })

      const nextUser = profileRes.data.user
      updateUser(nextUser)
      setPhotoError(false)
      setForm((current) => ({ ...current, profilePicture }))
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
    setForm(buildFormFromUser(user))
  }

  const displayProfilePicture = useMemo(() => {
    if (!form.profilePicture) return ''
    if (!photoRetry) return form.profilePicture
    const separator = form.profilePicture.includes('?') ? '&' : '?'
    return `${form.profilePicture}${separator}retry=${photoRetry}`
  }, [form.profilePicture, photoRetry])

  const handlePhotoError = () => {
    if (form.profilePicture && photoRetry < 1) {
      setPhotoRetry((current) => current + 1)
      return
    }
    setPhotoError(true)
  }

  const showProfilePhoto = Boolean(form.profilePicture && !photoError)

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
                    <a className="btn btn-secondary profile-view-photo-btn" href={displayProfilePicture || form.profilePicture} target="_blank" rel="noreferrer">
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
