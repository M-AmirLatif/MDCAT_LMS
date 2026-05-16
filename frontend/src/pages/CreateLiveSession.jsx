import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import './CreateLiveSession.css'

export default function CreateLiveSession() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    scheduledAt: '',
    joinUrl: '',
  })
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const user = getAuthUser()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (user?.role === 'admin') {
          const res = await API.get('/admin/courses')
          setCourses(res.data.courses || [])
        } else {
          const res = await API.get('/courses/teacher/my-courses')
          setCourses(res.data.courses || [])
        }
      } catch (err) {
        setError('Failed to load courses')
      }
    }

    fetchCourses()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await API.post('/live-sessions', formData)
      setSuccess('Live session scheduled')
      setTimeout(() => navigate('/live-sessions'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create live session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-live-session">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
      <RoleTabs user={user} />

      <div className="create-live-session-container">
        <h2>Schedule Live Session</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleSubmit} className="live-session-form">
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
            <label>Scheduled At</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Join URL *</label>
            <input
              name="joinUrl"
              value={formData.joinUrl}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : 'Create Session'}
          </button>
        </form>
      </div>
    </div>
  )
}
