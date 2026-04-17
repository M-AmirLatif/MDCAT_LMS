import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import { getSampleMcqs } from '../data/sampleMcqs'
import './MCQTest.css'

export default function MCQTest() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [mcqs, setMcqs] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [negativeScore, setNegativeScore] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [percentage, setPercentage] = useState(0)
  const [results, setResults] = useState({})
  const [error, setError] = useState('')
  const [testSessionId, setTestSessionId] = useState(null)
  const user = getAuthUser()

  // Timer state
  const [enableTimer, setEnableTimer] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(30)
  const [timeRemaining, setTimeRemaining] = useState(null) // seconds
  const [testStarted, setTestStarted] = useState(false)
  const [enableNegativeMarking, setEnableNegativeMarking] = useState(false)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (courseId.startsWith('sample-')) {
          setCourse({ name: 'MDCAT Sample Entry Test (Free Trial)' })
          setTopics([])
          setLoading(false)
          return
        }

        const [courseRes, topicsRes] = await Promise.all([
          API.get(`/courses/${courseId}`),
          API.get(`/mcqs/course/${courseId}/topics`),
        ])
        setCourse(courseRes.data.course)
        setTopics(topicsRes.data.topics || [])
      } catch {
        setError('Failed to load course data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courseId])

  const loadMcqs = useCallback(async () => {
    try {
      if (courseId.startsWith('sample-')) {
        const subject = courseId.replace('sample-', '')
        const sample = getSampleMcqs({ subject, limit: 10 })
        setMcqs(sample)
        setTotalQuestions(sample.length)
        setAnswers({})
        setSubmitted(false)
        setResults({})
        return
      }

      const params = {}
      if (selectedTopic !== 'All') params.topic = selectedTopic
      const res = await API.get(`/mcqs/course/${courseId}`, { params })
      const mcqList = res.data.mcqs || []
      setMcqs(mcqList)
      setTotalQuestions(mcqList.length)
      setAnswers({})
      setSubmitted(false)
      setResults({})
    } catch {
      setError('Failed to load MCQs')
    }
  }, [courseId, selectedTopic])

  const handleStartTest = async () => {
    await loadMcqs()
    setTestStarted(true)
    startTimeRef.current = Date.now()
    if (enableTimer) {
      setTimeRemaining(timerMinutes * 60)
    }
  }

  // Timer countdown
  useEffect(() => {
    if (!testStarted || !enableTimer || timeRemaining === null || submitted) return

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // Auto-submit on timeout
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [testStarted, enableTimer, submitted]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeRemaining === 0 && !submitted && testStarted) {
      handleSubmit()
    }
  }, [timeRemaining]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (mcqId, optionIndex) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [mcqId]: optionIndex }))
  }

  const handleSubmit = async () => {
    setError('')
    if (mcqs.length === 0) return
    if (timerRef.current) clearInterval(timerRef.current)

    const timeSpent = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : null

    const payload = {
      courseId,
      topic: selectedTopic === 'All' ? null : selectedTopic,
      enableNegativeMarking,
      timeLimitSeconds: enableTimer ? timerMinutes * 60 : null,
      timeSpentSeconds: timeSpent,
      answers: mcqs
        .map((mcq) => ({
          mcqId: mcq._id,
          selectedIndex: answers[mcq._id],
        }))
        .filter((item) => item.selectedIndex !== undefined),
    }

    if (courseId.startsWith('sample-')) {
      let correct = 0;
      let wrong = 0;
      const resMap = {};
      
      mcqs.forEach((mcq) => {
        const selected = answers[mcq._id];
        const isCorrect = selected === mcq.correctIndex;
        if (selected !== undefined) {
          if (isCorrect) correct++;
          else wrong++;
        }
        resMap[mcq._id] = {
          mcqId: mcq._id,
          correctIndex: mcq.correctIndex,
          isCorrect,
          explanation: mcq.explanation,
        };
      });

      const neg = enableNegativeMarking ? wrong : 0;
      const fScore = correct - neg;
      const perc = Math.max(0, Math.round((fScore / mcqs.length) * 100));

      setResults(resMap);
      setScore(correct);
      setNegativeScore(neg);
      setFinalScore(fScore);
      setTotalQuestions(mcqs.length);
      setPercentage(perc);
      setTestSessionId(null);
      setSubmitted(true);
      return;
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
      setNegativeScore(res.data.negativeScore || 0)
      setFinalScore(res.data.finalScore || 0)
      setTotalQuestions(res.data.totalQuestions || mcqs.length)
      setPercentage(res.data.percentage || 0)
      setTestSessionId(res.data.testSessionId)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit test')
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) return <div className="mcq-test"><p>Loading...</p></div>

  // Test config screen
  if (!testStarted) {
    return (
      <div className="mcq-test">
        <div className="navbar">
          <h1>MDCAT LMS</h1>
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
        <RoleTabs user={user} />

        <div className="mcq-container">
          <h2>{course?.name || 'MCQ Test'}</h2>
          <p className="subtitle">Configure your test settings</p>

          <div className="test-config">
            <div className="config-group">
              <label>Select Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                <option value="All">All Topics</option>
                {topics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="config-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={enableTimer}
                  onChange={(e) => setEnableTimer(e.target.checked)}
                />
                <span>Enable Timer</span>
              </label>
              {enableTimer && (
                <div className="timer-input">
                  <input
                    type="number"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={300}
                  />
                  <span>minutes</span>
                </div>
              )}
            </div>

            <div className="config-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={enableNegativeMarking}
                  onChange={(e) => setEnableNegativeMarking(e.target.checked)}
                />
                <span>Enable Negative Marking (-1 per wrong answer)</span>
              </label>
            </div>

            <button className="start-btn" onClick={handleStartTest}>
              Start Test
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mcq-test">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <div className="navbar-right">
          {enableTimer && timeRemaining !== null && !submitted && (
            <span className={`timer ${timeRemaining <= 60 ? 'timer-warning' : ''}`}>
              ⏱ {formatTime(timeRemaining)}
            </span>
          )}
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
      <RoleTabs user={user} />

      <div className="mcq-container">
        <h2>{course?.name || 'MCQ Test'}</h2>
        <p className="subtitle">
          {selectedTopic !== 'All' && <span className="topic-badge">{selectedTopic}</span>}
          {enableNegativeMarking && <span className="neg-badge">−1 Negative Marking</span>}
          {mcqs.length} question{mcqs.length !== 1 ? 's' : ''}
        </p>
        {error && <p className="error-message">{error}</p>}

        {mcqs.length === 0 ? (
          <p>No MCQs available for this selection.</p>
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
                          <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
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
                  Submit Test ({Object.keys(answers).length}/{mcqs.length} answered)
                </button>
              ) : (
                <div className="result-box">
                  <div className="result-main">
                    <span className="result-percentage">{percentage}%</span>
                    <span className="result-label">
                      {finalScore}/{totalQuestions}
                    </span>
                  </div>
                  {enableNegativeMarking && negativeScore > 0 && (
                    <p className="neg-info">
                      Correct: {score} | Wrong: -{negativeScore} | Final: {finalScore}
                    </p>
                  )}
                  {testSessionId && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/test-review/${testSessionId}`)}
                    >
                      Review Answers
                    </button>
                  )}
                  {courseId.startsWith('sample-') && (
                    <div style={{ marginTop: '24px', padding: '16px', background: 'var(--brand-light)', borderRadius: '8px', color: 'var(--brand-dark)' }}>
                      <strong>Test Completed!</strong> This was just a free sample. To track your performance analytics and unlock all 3,000+ questions, please <a href="/login" style={{textDecoration: 'underline'}}>Log In</a> or <a href="/register" style={{textDecoration: 'underline'}}>Register</a>.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
