import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../services/api'
import './CreateAssignment.css'

export default function CreateAssignment() {
  const { courseId: courseIdParam } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    courseId: courseIdParam || '',
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxMarks: 100,
  })
  const [courses, setCourses] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

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

  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const uploaded = await uploadFile(file)
        setAttachments((prev) => [
          ...prev,
          { fileName: uploaded.fileName, fileUrl: uploaded.fileUrl },
        ])
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
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
      await API.post('/assignments', {
        ...formData,
        attachments,
      })
      setSuccess('Assignment created')
      setTimeout(
        () => navigate(`/course/${formData.courseId || courseIdParam}/assignments`),
        1200,
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-assignment">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="create-assignment-container">
        <h2>Create Assignment</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleSubmit} className="assignment-form">
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
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label>Instructions</label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Max Marks</label>
            <input
              type="number"
              name="maxMarks"
              value={formData.maxMarks}
              onChange={handleChange}
              min="1"
            />
          </div>

          <div className="attachments">
            <h4>Attachments</h4>
            <input type="file" multiple onChange={handleAttachmentUpload} />
            {attachments.length > 0 && (
              <ul>
                {attachments.map((file, idx) => (
                  <li key={`${file.fileUrl}-${idx}`}>
                    {file.fileName}
                    <button type="button" onClick={() => removeAttachment(idx)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={loading || uploading}>
            {loading || uploading ? 'Saving...' : 'Create Assignment'}
          </button>
        </form>
      </div>
    </div>
  )
}
