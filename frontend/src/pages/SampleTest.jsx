import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getSampleMcqs } from '../data/sampleMcqs'
import './SampleTest.css'

const SUBJECTS = [
  { key: 'biology', label: 'Biology', tone: 'green' },
  { key: 'chemistry', label: 'Chemistry', tone: 'orange' },
  { key: 'physics', label: 'Physics', tone: 'blue' },
  { key: 'english', label: 'English', tone: 'violet' },
]

const normalizeSubject = (value) => SUBJECTS.find((s) => s.key === String(value || '').trim().toLowerCase())?.key || 'biology'

export default function SampleTest() {
  const { subject: subjectParam } = useParams()
  const navigate = useNavigate()
  const [subject, setSubject] = useState(() => normalizeSubject(subjectParam))
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const current = questions[index] || null
  const total = questions.length

  const startNew = (nextSubject = subject) => {
    setQuestions(getSampleMcqs({ subject: nextSubject, limit: 10 }))
    setAnswers({})
    setIndex(0)
    setSubmitted(false)
  }

  useEffect(() => {
    setSubject(normalizeSubject(subjectParam))
  }, [subjectParam])

  useEffect(() => {
    startNew(subject)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const score = useMemo(
    () => (submitted ? questions.filter((q) => answers[q._id] === q.correctIndex).length : 0),
    [answers, questions, submitted],
  )
  const percent = submitted && total ? Math.round((score / total) * 100) : 0
  const tone = SUBJECTS.find((s) => s.key === subject)?.tone || 'blue'

  const setChoice = (mcqId, optionIndex) => {
    if (!submitted) setAnswers((prev) => ({ ...prev, [mcqId]: optionIndex }))
  }

  const handleSubmit = () => {
    if (!questions.length) return
    if (answeredCount === 0) {
      toast.error('Attempt at least 1 question.')
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="sample-test">
      <header className="sample-top">
        <div className="sample-top-inner">
          <Link className="sample-brand" to="/">
            <span className="sample-mark" aria-hidden="true">M</span>
            <span className="sample-brand-text">MDCAT LMS</span>
          </Link>
          <div className="sample-top-actions">
            <Link className="btn btn-secondary" to="/login">Login</Link>
            <Link className="btn btn-primary" to="/register">Join Now</Link>
          </div>
        </div>
      </header>

      <section className="sample-hero">
        <div className="sample-container">
          <div className="sample-hero-head">
            <h1>Free Sample Test</h1>
            <p>Public sample tests will use real MDCAT questions after your content team publishes them.</p>
          </div>

          <div className="sample-subjects" role="tablist" aria-label="Sample test subjects">
            {SUBJECTS.map((s) => (
              <button key={s.key} type="button" className={`sample-pill ${subject === s.key ? 'active' : ''}`} onClick={() => navigate(`/sample-test/${s.key}`)}>
                {s.label}
              </button>
            ))}
          </div>

          <div className={`sample-card sample-tone-${tone}`}>
            <div className="sample-card-head">
              <div className="sample-meta">
                <span className="sample-badge">{total ? `${Math.min(index + 1, total)} / ${total}` : '0 / 10'}</span>
                <span className="sample-badge subtle">{answeredCount} answered</span>
                {current?.topic && <span className="sample-badge subtle">{current.topic}</span>}
              </div>
              <button type="button" className="sample-reset" onClick={() => startNew(subject)}>
                {submitted ? 'Restart' : 'New set'}
              </button>
            </div>

            {!current ? (
              <div className="sample-empty">
                <h2>Sample test is not available yet</h2>
                <p>Demo MCQs have been removed for production. Add real MDCAT questions before enabling public sample tests.</p>
                <Link className="btn btn-primary" to="/register">Create account</Link>
              </div>
            ) : (
              <>
                <h2 className="sample-question">{current.question}</h2>
                <div className="sample-options" role="list">
                  {current.options.map((opt, optIndex) => {
                    const selected = answers[current._id] === optIndex
                    const isCorrect = optIndex === current.correctIndex
                    const showState = submitted && answers[current._id] !== undefined
                    const stateClass = showState ? (isCorrect ? 'correct' : selected ? 'wrong' : '') : selected ? 'selected' : ''
                    return (
                      <button type="button" key={`${current._id}-${optIndex}`} className={`sample-option ${stateClass}`.trim()} onClick={() => setChoice(current._id, optIndex)} disabled={submitted}>
                        <span className="sample-letter" aria-hidden="true">{String.fromCharCode(65 + optIndex)}</span>
                        <span className="sample-option-text">{opt.text}</span>
                      </button>
                    )
                  })}
                </div>

                {submitted && answers[current._id] !== undefined && (
                  <div className="sample-explain">
                    <div className="sample-explain-title">Explanation</div>
                    <div className="sample-explain-body">{current.explanation}</div>
                  </div>
                )}

                <div className="sample-nav">
                  <button type="button" className="btn btn-secondary" onClick={() => setIndex((v) => Math.max(0, v - 1))} disabled={index === 0}>Back</button>
                  {!submitted ? (
                    <button type="button" className="btn btn-primary" onClick={() => (index === total - 1 ? handleSubmit() : setIndex((v) => Math.min(total - 1, v + 1)))} disabled={!total}>
                      {index === total - 1 ? 'Submit' : 'Next'}
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => setIndex((v) => Math.min(total - 1, v + 1))} disabled={index === total - 1}>Next</button>
                  )}
                </div>
              </>
            )}
          </div>

          {submitted && (
            <div className="sample-result">
              <div className="sample-result-card">
                <div className="sample-result-kpi"><div className="sample-kpi-value">{score}</div><div className="sample-kpi-label">Correct out of {total}</div></div>
                <div className="sample-result-kpi"><div className="sample-kpi-value">{percent}%</div><div className="sample-kpi-label">Score</div></div>
                <div className="sample-result-copy">
                  <div className="sample-result-title">Want full access?</div>
                  <div className="sample-result-text">Join MDCAT LMS to unlock full courses, tests, performance analytics, and more.</div>
                  <div className="sample-result-actions">
                    <Link className="btn btn-primary" to="/register">Continue with Google</Link>
                    <Link className="btn btn-secondary" to="/login">I already have an account</Link>
                  </div>
                </div>
              </div>
              <div className="sample-footnote">Tip: You can restart or switch subjects anytime.</div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
