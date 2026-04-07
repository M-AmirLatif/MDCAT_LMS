import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../services/api'
import './CreateMCQ.css'

const defaultOptions = ['', '', '', '']

export default function CreateMCQ() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(defaultOptions)
  const [correctIndex, setCorrectIndex] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleOptionChange = (index, value) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        courseId,
        topic,
        question,
        options: options.map((text, idx) => ({
          text,
          isCorrect: idx === Number(correctIndex),
        })),
        explanation,
        isPublished: true,
      }

      await API.post('/mcqs', payload)
      setSuccess('MCQ created successfully!')
      setTopic('')
      setQuestion('')
      setOptions(defaultOptions)
      setCorrectIndex(0)
      setExplanation('')

      setTimeout(() => {
        navigate(`/course/${courseId}`)
      }, 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating MCQ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-mcq">
      <div className="navbar">
        <h1>🎓 MDCAT LMS</h1>
        <button onClick={() => navigate(`/course/${courseId}`)}>Back</button>
      </div>

      <div className="create-mcq-container">
        <h2>Create New MCQ</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="mcq-form">
          <div className="form-group">
            <label>Topic *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Cell Biology"
              required
            />
          </div>

          <div className="form-group">
            <label>Question *</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows="3"
              placeholder="Type your question here..."
              required
            ></textarea>
          </div>

          <div className="options-group">
            <label>Options *</label>
            {options.map((opt, idx) => (
              <div key={idx} className="option-row">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  required
                />
                <label className="radio-label">
                  <input
                    type="radio"
                    name="correct"
                    value={idx}
                    checked={Number(correctIndex) === idx}
                    onChange={(e) => setCorrectIndex(e.target.value)}
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Explanation (Optional)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows="3"
              placeholder="Explain why the correct option is right..."
            ></textarea>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create MCQ'}
          </button>
        </form>
      </div>
    </div>
  )
}
