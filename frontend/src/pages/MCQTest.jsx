import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import './MCQTest.css'
import { getChapterById, getMcqsByChapter, getSubjectById, SUBJECT_STYLES } from './platformContent'

function getCorrectIndex(mcq) {
  return ['A', 'B', 'C', 'D'].indexOf(mcq.correctAnswer)
}

export default function MCQTest() {
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const chapterId = searchParams.get('chapter')
  const navigate = useNavigate()
  const subject = getSubjectById(courseId)
  const chapter = getChapterById(courseId, chapterId)
  const mcqs = useMemo(() => getMcqsByChapter(courseId, chapterId), [chapterId, courseId])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const currentMcq = mcqs[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = mcqs.length ? Math.round(((currentIndex + 1) / mcqs.length) * 100) : 0
  const style = subject ? SUBJECT_STYLES[subject.name] : SUBJECT_STYLES.Biology

  const result = useMemo(() => {
    const detailed = mcqs.map((mcq) => {
      const selectedIndex = answers[mcq.id]
      const correctIndex = getCorrectIndex(mcq)
      const isCorrect = selectedIndex === correctIndex
      return { ...mcq, selectedIndex, correctIndex, isCorrect }
    })
    const correct = detailed.filter((item) => item.isCorrect).length
    const wrong = detailed.filter((item) => item.selectedIndex !== undefined && !item.isCorrect).length
    const percentage = mcqs.length ? Math.round((correct / mcqs.length) * 100) : 0
    return { detailed, correct, wrong, percentage }
  }, [answers, mcqs])

  if (!subject || !chapter) {
    return (
      <div className="workspace-page">
        <div className="empty-state">
          <div className="empty-orb" />
          <h3>Practice set not found</h3>
          <p>Select a valid MDCAT subject and chapter before starting a test.</p>
          <Link className="btn btn-primary" to="/courses">Back to Subjects</Link>
        </div>
      </div>
    )
  }

  if (!currentMcq) {
    return (
      <div className="workspace-page">
        <div className="empty-state">
          <div className="empty-orb" />
          <h3>No MCQs in this chapter yet</h3>
          <p>Teachers will add real questions, correct answers, and explanations before students can attempt this chapter.</p>
          <Link className="btn btn-primary" to={`/course/${subject.id}`}>Back to Chapters</Link>
        </div>
      </div>
    )
  }

  const handleSelect = (optionIndex) => {
    if (submitted) return
    setAnswers((current) => ({ ...current, [currentMcq.id]: optionIndex }))
  }

  const submit = () => {
    setSubmitted(true)
  }

  const openReview = () => {
    navigate(`/test-review/${subject.id}-${chapter.id}`, {
      state: {
        subject,
        chapter,
        result,
      },
    })
  }

  return (
    <div className="mcq-practice-page animate-fade-up">
      <section className="mcq-practice-shell">
        <div className="mcq-practice-top">
          <div>
            <div className="label-xs" style={{ color: style.accent }}>{subject.name}</div>
            <h1>{chapter.name}</h1>
            <p>{chapter.description}</p>
          </div>
          <Link className="btn btn-secondary" to={`/course/${subject.id}`}>Back to Chapters</Link>
        </div>

        <div className="mcq-progress-card">
          <div className="mcq-progress-row">
            <span>Question {currentIndex + 1} of {mcqs.length}</span>
            <strong>{answeredCount}/{mcqs.length} answered</strong>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ '--fill': `${progress}%`, width: `${progress}%`, background: style.progress }} />
          </div>
        </div>

        {!submitted ? (
          <div className="mcq-question-card">
            <div className="mcq-question-meta">
              <span className="state-chip state-chip--neutral">{subject.name}</span>
              <span className="state-chip state-chip--warning">{chapter.name}</span>
            </div>
            <h2>{currentMcq.question}</h2>
            <div className="mcq-options-grid">
              {currentMcq.options.map((option, index) => {
                const selected = answers[currentMcq.id] === index
                return (
                  <button
                    key={`${currentMcq.id}-${option}`}
                    className={`mcq-option-card ${selected ? 'mcq-option-card--selected' : ''}`}
                    type="button"
                    onClick={() => handleSelect(index)}
                  >
                    <span className="mcq-option-letter">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                  </button>
                )
              })}
            </div>

            <div className="mcq-nav-actions">
              <button className="btn btn-secondary" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((current) => current - 1)}>Previous</button>
              {currentIndex < mcqs.length - 1 ? (
                <button className="btn btn-primary" type="button" onClick={() => setCurrentIndex((current) => current + 1)}>Next</button>
              ) : (
                <button className="btn btn-primary" type="button" onClick={submit}>Submit</button>
              )}
            </div>
          </div>
        ) : (
          <div className="mcq-result-card">
            <div className="mcq-result-score">{result.percentage}%</div>
            <h2>{subject.name} • {chapter.name}</h2>
            <p>{result.correct} correct • {result.wrong} wrong • {mcqs.length - result.correct - result.wrong} unattempted</p>
            <div className="workspace-columns-3">
              <div className="stat-tile stat-tile--teal"><span>Correct</span><strong>{result.correct}</strong></div>
              <div className="stat-tile stat-tile--coral"><span>Wrong</span><strong>{result.wrong}</strong></div>
              <div className="stat-tile stat-tile--purple"><span>Total</span><strong>{mcqs.length}</strong></div>
            </div>
            <div className="inline-actions" style={{ marginTop: '20px', justifyContent: 'center' }}>
              <button className="btn btn-primary" type="button" onClick={openReview}>Open Detailed Review</button>
              <Link className="btn btn-secondary" to={`/course/${subject.id}`}>Practice Another Chapter</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
