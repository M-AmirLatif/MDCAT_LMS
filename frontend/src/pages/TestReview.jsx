import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthToken, getAuthUser } from '../services/authStorage'
import './TestReview.css'

export default function TestReview() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'wrong' | 'correct'
  const user = getAuthUser()

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          navigate('/login')
          return
        }
        const res = await API.get(`/tests/${sessionId}`)
        setSession(res.data.session)
      } catch {
        setError('Failed to load test details')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [sessionId, navigate])

  if (loading)
    return (
      <div className="page-content">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading review...</p>
        </div>
      </div>
    )

  const answers = session?.answers || []
  const filtered = answers.filter((a) => {
    if (filter === 'wrong') return !a.isCorrect
    if (filter === 'correct') return a.isCorrect
    return true
  })

  const correctCount = answers.filter((a) => a.isCorrect).length
  const wrongCount = answers.filter((a) => !a.isCorrect).length

  return (
    <div className="test-review">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/performance')}>Back</button>
      </div>
      <RoleTabs user={user} />

      <div className="test-review-container">
        <h2>Test Review</h2>
        {error && <p className="error-message">{error}</p>}

        {session && (
          <>
            <div className="review-stats">
              <div className="review-stat correct">
                <span className="stat-num">{correctCount}</span>
                <span className="stat-label">Correct</span>
              </div>
              <div className="review-stat wrong">
                <span className="stat-num">{wrongCount}</span>
                <span className="stat-label">Wrong</span>
              </div>
              <div className="review-stat total">
                <span className="stat-num">{session.percentage}%</span>
                <span className="stat-label">Score</span>
              </div>
              {session.timeSpentSeconds > 0 && (
                <div className="review-stat time">
                  <span className="stat-num">
                    {Math.floor(session.timeSpentSeconds / 60)}m{' '}
                    {session.timeSpentSeconds % 60}s
                  </span>
                  <span className="stat-label">Time</span>
                </div>
              )}
            </div>

            <div className="review-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({answers.length})
              </button>
              <button
                className={`filter-btn ${filter === 'wrong' ? 'active' : ''}`}
                onClick={() => setFilter('wrong')}
              >
                Wrong ({wrongCount})
              </button>
              <button
                className={`filter-btn ${filter === 'correct' ? 'active' : ''}`}
                onClick={() => setFilter('correct')}
              >
                Correct ({correctCount})
              </button>
            </div>

            <div className="review-questions">
              {filtered.map((answer, idx) => (
                <div
                  key={idx}
                  className={`review-card ${answer.isCorrect ? 'is-correct' : 'is-wrong'}`}
                >
                  <div className="review-card-head">
                    <span className="q-number">Q{idx + 1}</span>
                    <span className={`q-badge ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                      {answer.isCorrect ? '✓ Correct' : '✗ Wrong'}
                    </span>
                    {answer.difficulty && (
                      <span className={`q-difficulty ${answer.difficulty}`}>
                        {answer.difficulty}
                      </span>
                    )}
                  </div>

                  <p className="q-text">{answer.question}</p>

                  <div className="q-options">
                    {answer.options?.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`q-option 
                          ${oIdx === answer.correctIndex ? 'option-correct' : ''} 
                          ${oIdx === answer.selectedIndex && !answer.isCorrect ? 'option-wrong' : ''}
                          ${oIdx === answer.selectedIndex && answer.isCorrect ? 'option-correct' : ''}
                        `}
                      >
                        <span className="option-letter">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt.text}</span>
                        {oIdx === answer.correctIndex && (
                          <span className="option-tag correct-tag">✓ Correct</span>
                        )}
                        {oIdx === answer.selectedIndex && oIdx !== answer.correctIndex && (
                          <span className="option-tag wrong-tag">Your answer</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {answer.explanation && (
                    <div className="q-explanation">
                      <strong>Explanation:</strong> {answer.explanation}
                    </div>
                  )}

                  {answer.topic && (
                    <div className="q-topic">Topic: {answer.topic}</div>
                  )}
                </div>
              ))}

              {filtered.length === 0 && (
                <p className="no-results">No questions match this filter.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
