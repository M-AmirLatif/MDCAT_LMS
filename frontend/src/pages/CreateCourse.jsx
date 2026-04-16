import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import './CreateCourse.css'

export default function CreateCourse() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Biology',
    isPublished: false,
  })
  const [topicName, setTopicName] = useState('')
  const [topicDescription, setTopicDescription] = useState('')
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const user = getAuthUser()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const addTopic = () => {
    if (!topicName.trim()) return
    setTopics((prev) => [
      ...prev,
      { name: topicName.trim(), description: topicDescription.trim() },
    ])
    setTopicName('')
    setTopicDescription('')
  }

  const removeTopic = (index) => {
    setTopics((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await API.post('/courses', {
        ...formData,
        topics,
      })
      setSuccess('Course created successfully!')
      setTimeout(() => navigate('/teacher/courses'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-course">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
      <RoleTabs user={user} />

      <div className="create-course-container">
        <h2>Create New Course</h2>
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
              placeholder="e.g., MDCAT Biology"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe this course..."
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
            <label>Publish immediately</label>
          </div>

          <div className="topics-group">
            <h3>Add Topics (Optional)</h3>
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

            {topics.length > 0 && (
              <ul className="topics-list">
                {topics.map((topic, idx) => (
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

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </div>
    </div>
  )
}


