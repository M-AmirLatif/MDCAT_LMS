import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import toast, { Toaster } from 'react-hot-toast'
import './Notifications.css'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [courses, setCourses] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general',
    courseId: '',
    sendAt: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = getAuthUser()
  const isTeacher =
    user?.role === 'teacher' || user?.role === 'admin'

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications')
      setNotifications(res.data.notifications || [])
    } catch (err) {
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    if (!isTeacher) return
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

  useEffect(() => {
    fetchNotifications()
    fetchCourses()
  }, [])

  const markAsRead = async (notificationId) => {
    try {
      await API.post('/notifications/mark-as-read', { notificationId })
      fetchNotifications()
    } catch (err) {
      setError('Failed to update notification')
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required')
      return;
    }
    
    try {
      if (formData.sendAt) {
        // Schedule it
        await API.post('/notifications/schedule', {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          courseId: formData.courseId || undefined,
          sendAt: formData.sendAt,
        })
        toast.success('Announcement scheduled successfully!')
      } else {
        // Send now
        const res = await API.post('/notifications/broadcast', {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          courseId: formData.courseId || undefined,
        })
        
        if (res.data.count === 0) {
           toast.success('Broadcast recorded, but 0 students currently enrolled')
        } else {
           toast.success(`Announcement sent to ${res.data.count} student(s)!`)
        }
      }
      
      setFormData({ ...formData, title: '', message: '', sendAt: '' })
      fetchNotifications()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send notification')
      setError(err.response?.data?.error || 'Failed to send notification')
    }
  }

  if (loading)
    return (
      <div className="page-content">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading notifications...</p>
        </div>
      </div>
    )

  return (
    <div className="notifications page-content">
      <Toaster position="top-right" />
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/dashboard')}>Back</button>
      </div>
      <RoleTabs user={user} />

      <div className="notifications-container">
        <h2>Notifications</h2>
        {error && <p className="error-message">{error}</p>}

        {isTeacher && (
          <div className="broadcast-box">
            <h3>Send Announcement</h3>
            <input
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleChange}
            />
            <textarea
              name="message"
              placeholder="Message"
              value={formData.message}
              onChange={handleChange}
              rows="3"
            ></textarea>
            <div className="broadcast-row">
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="general">General</option>
                <option value="announcement">Announcement</option>
                <option value="lecture">Lecture</option>
                <option value="test">Test</option>
              </select>
              <select name="courseId" value={formData.courseId} onChange={handleChange}>
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                name="sendAt"
                value={formData.sendAt}
                onChange={handleChange}
              />
            </div>
            <div className="broadcast-actions">
              <button 
                onClick={handleSend} 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {formData.sendAt ? 'Schedule Announcement' : 'Send Now'}
              </button>
            </div>
          </div>
        )}

        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <div className="notification-list">
            {notifications.map((note) => (
              <div key={note._id} className={`notification-card ${note.isRead ? 'read' : ''}`}>
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.message}</p>
                  <span>
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {!note.isRead && (
                  <button onClick={() => markAsRead(note._id)}>Mark read</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
