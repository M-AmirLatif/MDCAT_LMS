import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'
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
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || 'student@mdcat.pk',
    phone: user?.phone || '+92 300 1234567',
    city: 'Lahore',
    target: 'King Edward Medical University',
    profilePicture: user?.profilePicture || '',
  })

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

      const profilePicture = uploadRes.data.fileUrl
      const profileRes = await API.put('/auth/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        profilePicture,
      })

      const nextUser = profileRes.data.user
      updateUser(nextUser)
      setForm((current) => ({ ...current, profilePicture }))
      toast.success('Profile photo updated.')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Photo upload failed')
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
        profilePicture: form.profilePicture || null,
      })
      updateUser(res.data.user)
      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const discardChanges = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || 'student@mdcat.pk',
      phone: user?.phone || '+92 300 1234567',
      city: 'Lahore',
      target: 'King Edward Medical University',
      profilePicture: user?.profilePicture || '',
    })
  }

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
                {form.profilePicture ? (
                  <img className="avatar-circle avatar-circle--image" src={form.profilePicture} alt={displayName} />
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
                </div>
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
            <div className="toggle-row"><div><strong>Push reminders</strong><p>Get live class alerts and test nudges.</p></div><span className="toggle toggle--on" /></div>
            <div className="toggle-row"><div><strong>Email summaries</strong><p>Weekly progress and invoice summaries.</p></div><span className="toggle toggle--on" /></div>
            <div className="toggle-row"><div><strong>Profile visibility</strong><p>Show your progress to assigned teachers.</p></div><span className="toggle" /></div>
          </div>
        </aside>
      </div>
    </div>
  )
}
