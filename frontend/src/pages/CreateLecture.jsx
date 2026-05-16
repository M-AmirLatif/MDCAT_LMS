import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import './CreateLecture.css'

export default function CreateLecture() {
  const { courseId: courseIdParam } = useParams()
  const [formData, setFormData] = useState({
    courseId: courseIdParam || '',
    title: '',
    description: '',
    topic: '',
    videoUrl: '',
    videoDuration: 0,
    notes: '',
  })
  const [courses, setCourses] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const user = getAuthUser()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!user) return
        const res =
          user.role === 'admin'
            ? await API.get('/admin/courses')
            : await API.get('/courses/teacher/my-courses')
        setCourses(res.data.courses || [])
      } catch (err) {
        setError('Failed to load courses')
      }
    }

    fetchCourses()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const uploadFile = async (file) => {
    const data = new FormData()
    data.append('file', file)
    const res = await API.post('/uploads/single', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadFile(file)
      setFormData((prev) => ({ ...prev, videoUrl: uploaded.fileUrl }))
    } catch (err) {
      setError(err.response?.data?.error || 'Video upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of files) {
        const uploaded = await uploadFile(file)
        setAttachments((prev) => [
          ...prev,
          { fileName: uploaded.fileName, fileUrl: uploaded.fileUrl },
        ])
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Attachment upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!formData.courseId) {
        setError('Please select a course')
        setLoading(false)
        return
      }
      if (!formData.videoUrl) {
        setError('Upload a video or provide a video URL')
        setLoading(false)
        return
      }
      await API.post('/lectures', {
        ...formData,
        videoDuration: parseInt(formData.videoDuration) || 0,
        isPublished: true,
        attachments,
      })

      setSuccess('Lecture created successfully!')
      setTimeout(() => {
        navigate(`/course/${formData.courseId || courseIdParam}`)
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating lecture')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-lecture">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(`/course/${formData.courseId || courseIdParam}`)}>
          Back
        </button>
      </div>
      <RoleTabs user={user} />

      <div className="create-lecture-container">
        <h2>Create New Lecture</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="lecture-form">
          <div className="form-group">
            <label>Course *</label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Lecture Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Newton's First Law"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Topic *</label>
            <input
              type="text"
              name="topic"
              placeholder="e.g., Mechanics"
              value={formData.topic}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              placeholder="Describe what this lecture covers..."
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Video (Upload or URL) *</label>
            <input
              type="url"
              name="videoUrl"
              placeholder="https://example.com/video.mp4"
              value={formData.videoUrl}
              onChange={handleChange}
            />
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
          </div>

          <div className="form-group">
            <label>Video Duration (seconds)</label>
            <input
              type="number"
              name="videoDuration"
              placeholder="e.g., 600"
              value={formData.videoDuration}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              name="notes"
              placeholder="Add any additional notes for students..."
              value={formData.notes}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Attachments</label>
            <input type="file" multiple onChange={handleAttachmentUpload} />
            {attachments.length > 0 && (
              <ul className="attachment-list">
                {attachments.map((att, idx) => (
                  <li key={`${att.fileUrl}-${idx}`}>
                    {att.fileName}
                    <button type="button" onClick={() => removeAttachment(idx)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" disabled={loading || uploading} className="submit-btn">
            {loading || uploading ? 'Saving...' : 'Create Lecture'}
          </button>
        </form>
      </div>
    </div>
  )
}
