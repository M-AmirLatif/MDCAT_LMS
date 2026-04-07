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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, mcqRes] = await Promise.all([
          API.get(`/courses/${courseId}`),
          API.get(`/mcqs/course/${courseId}`),
        ])
        setCourse(courseRes.data.course)
        setMcqs(mcqRes.data.mcqs || [])
      } catch (error) {
        console.error('Error loading MCQs:', error)
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

  const handleSubmit = () => {
    let correct = 0
    mcqs.forEach((mcq) => {
      const chosenIndex = answers[mcq._id]
      if (
        chosenIndex !== undefined &&
        mcq.options?.[chosenIndex]?.isCorrect
      ) {
        correct += 1
      }
    })
    setScore(correct)
    setSubmitted(true)
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
                      const isCorrect = submitted && opt.isCorrect
                      const isWrong =
                        submitted && selected && opt.isCorrect !== true

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
                  {submitted && mcq.explanation && (
                    <div className="explanation">
                      <strong>Explanation:</strong> {mcq.explanation}
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
                  Score: {score} / {mcqs.length}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
