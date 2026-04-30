import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import './EditCourse.css'

export default function EditCourse() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Biology',
    isPublished: false,
    topics: [],
  })
  const [topicName, setTopicName] = useState('')
  const [topicDescription, setTopicDescription] = useState('')
  const user = getAuthUser()

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await API.get(`/courses/${courseId}`)
        const course = res.data.course
        setFormData({
          name: course.name,
          description: course.description,
          category: course.category,
          isPublished: course.isPublished,
          topics: course.topics || [],
        })
      } catch (err) {
        setError('Failed to load course')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const addTopic = () => {
    if (!topicName.trim()) return
    setFormData((prev) => ({
      ...prev,
      topics: [
        ...prev.topics,
        { name: topicName.trim(), description: topicDescription.trim() },
      ],
    }))
    setTopicName('')
    setTopicDescription('')
  }

  const removeTopic = (index) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, idx) => idx !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await API.put(`/courses/${courseId}`, formData)
      setSuccess('Course updated successfully!')
      setTimeout(() => navigate('/teacher/courses'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update course')
    }
  }

  if (loading)
    return (
      <div className="page-content">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading course...</p>
        </div>
      </div>
    )

  return (
    <div className="edit-course">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
      <RoleTabs user={user} />

      <div className="edit-course-container">
        <h2>Edit Course</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleSubmit} className="course-form">
          <div className="form-group">
            <label>Course Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option>Biology</option>
              <option>Chemistry</option>
              <option>Physics</option>
              <option>English</option>
              <option>Urdu</option>
              <option>Islamic Studies</option>
            </select>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
            />
            <label>Published</label>
          </div>

          <div className="topics-group">
            <h3>Topics</h3>
            <div className="topic-inputs">
              <input
                type="text"
                placeholder="Topic name"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Topic description"
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
              />
              <button type="button" onClick={addTopic}>
                Add Topic
              </button>
            </div>

            {formData.topics.length > 0 && (
              <ul className="topics-list">
                {formData.topics.map((topic, idx) => (
                  <li key={`${topic.name}-${idx}`}>
                    <span>
                      <strong>{topic.name}</strong> {topic.description}
                    </span>
                    <button type="button" onClick={() => removeTopic(idx)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="submit-btn">
            Update Course
          </button>
        </form>
      </div>
    </div>
  )
}


