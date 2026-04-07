import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../services/api'
import './MCQTest.css'

export default function MCQTest() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [mcqs, setMcqs] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [percentage, setPercentage] = useState(0)
  const [results, setResults] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, mcqRes] = await Promise.all([
          API.get(`/courses/${courseId}`),
          API.get(`/mcqs/course/${courseId}`),
        ])
        setCourse(courseRes.data.course)
        const mcqList = mcqRes.data.mcqs || []
        setMcqs(mcqList)
        setTotalQuestions(mcqList.length)
      } catch (error) {
        console.error('Error loading MCQs:', error)
        setError('Failed to load MCQs')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  const handleSelect = (mcqId, optionIndex) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [mcqId]: optionIndex }))
  }

  const handleSubmit = async () => {
    setError('')
    if (mcqs.length === 0) return

    const payload = {
      courseId,
      answers: mcqs
        .map((mcq) => ({
          mcqId: mcq._id,
          selectedIndex: answers[mcq._id],
        }))
        .filter((item) => item.selectedIndex !== undefined),
    }

    if (payload.answers.length === 0) {
      setError('Please answer at least one question before submitting.')
      return
    }

    try {
      const res = await API.post('/tests/submit', payload)
      const map = {}
      res.data.results?.forEach((item) => {
        map[item.mcqId] = item
      })
      setResults(map)
      setScore(res.data.score || 0)
      setTotalQuestions(res.data.totalQuestions || mcqs.length)
      setPercentage(res.data.percentage || 0)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit test')
    }
  }

  if (loading)
    return (
      <div className="mcq-test">
        <p>Loading MCQs...</p>
      </div>
    )

  return (
    <div className="mcq-test">
      <div className="navbar">
        <h1>🎓 MDCAT LMS</h1>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="mcq-container">
        <h2>{course?.name || 'MCQ Test'}</h2>
        <p className="subtitle">Answer all questions and submit</p>
        {error && <p className="error-message">{error}</p>}

        {mcqs.length === 0 ? (
          <p>No MCQs available for this course yet.</p>
        ) : (
          <>
            <div className="mcq-list">
              {mcqs.map((mcq, index) => (
                <div key={mcq._id} className="mcq-card">
                  <h3>
                    {index + 1}. {mcq.question}
                  </h3>
                  <div className="options">
                    {mcq.options?.map((opt, idx) => {
                      const selected = answers[mcq._id] === idx
                      const result = results[mcq._id]
                      const isCorrect =
                        submitted && result && result.correctIndex === idx
                      const isWrong =
                        submitted &&
                        result &&
                        selected &&
                        result.isCorrect === false

                      return (
                        <button
                          key={`${mcq._id}-${idx}`}
                          className={`option ${selected ? 'selected' : ''} ${
                            isCorrect ? 'correct' : ''
                          } ${isWrong ? 'wrong' : ''}`}
                          onClick={() => handleSelect(mcq._id, idx)}
                        >
                          {opt.text}
                        </button>
                      )
                    })}
                  </div>
                  {submitted && results[mcq._id]?.explanation && (
                    <div className="explanation">
                      <strong>Explanation:</strong>{' '}
                      {results[mcq._id]?.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="actions">
              {!submitted ? (
                <button className="submit-btn" onClick={handleSubmit}>
                  Submit Test
                </button>
              ) : (
                <div className="score-box">
                  Score: {score} / {totalQuestions} ({percentage}%)
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

