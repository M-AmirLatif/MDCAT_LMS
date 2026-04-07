import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import './CreateLecture.css'

export default function CreateLecture() {
  const { courseId } = useParams()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    videoUrl: '',
    videoDuration: 0,
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await API.post('/lectures', {
        ...formData,
        courseId,
        videoDuration: parseInt(formData.videoDuration) || 0,
        isPublished: true,
      })

      setSuccess('Lecture created successfully!')
      setTimeout(() => {
        navigate(`/course/${courseId}`)
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
        <h1>🎓 MDCAT LMS</h1>
        <button onClick={() => navigate(`/course/${courseId}`)}>← Back</button>
      </div>

      <div className="create-lecture-container">
        <h2>📹 Create New Lecture</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="lecture-form">
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
            <label>Video URL *</label>
            <input
              type="url"
              name="videoUrl"
              placeholder="https://example.com/video.mp4"
              value={formData.videoUrl}
              onChange={handleChange}
              required
            />
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

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating Lecture...' : 'Create Lecture'}
          </button>
        </form>
      </div>
    </div>
  )
}

