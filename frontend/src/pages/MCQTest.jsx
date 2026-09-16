import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MCQRenderer from '../components/MCQRenderer'
import './MCQTest.css'

const compactImageList = (...values) => values.flatMap((value) => {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : [value]
})

const mcqQuestionImages = (mcq) => compactImageList(
  mcq?.questionImages,
  mcq?.questionImage,
  mcq?.questionImageUrl,
  mcq?.questionImageUrls,
  mcq?.imageUrl,
  mcq?.imageUrls,
  mcq?.images,
)

const mcqExplanationImages = (mcq) => compactImageList(
  mcq?.explanationImages,
  mcq?.explanationImage,
  mcq?.explanationImageUrl,
  mcq?.explanationImageUrls,
  mcq?.explanationImagesUrl,
)

const mcqOptionImages = (mcq, option, letter) => compactImageList(
  option?.images,
  option?.imageUrl,
  option?.imageUrls,
  option?.src,
  option?.url,
  mcq?.[`option${letter}Images`],
  mcq?.[`option${letter}Image`],
  mcq?.[`option${letter}ImageUrl`],
  mcq?.[`option${letter}ImageUrls`],
)

import { getChapterById, getMcqsByChapter, getSubjectById, getSubjectStyle } from './platformContent'

function getCorrectIndex(mcq) {
  return ['A', 'B', 'C', 'D'].indexOf(mcq.correctAnswer)
}

export default function MCQTest() {
  const { user } = useAuth()
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const chapterId = searchParams.get('chapter')
  const navigate = useNavigate()
  const subject = getSubjectById(courseId)
  const chapter = getChapterById(courseId, chapterId)
  const mcqs = useMemo(() => getMcqsByChapter(courseId, chapterId), [chapterId, courseId])

  const quizUserKey = useMemo(() => user?.email || user?._id || user?.id || 'guest', [user])
  const quizStorageKey = useMemo(() => `mcq-course-test-${quizUserKey}-${courseId}-${chapterId}`, [quizUserKey, courseId, chapterId])

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(quizStorageKey) || 'null')
      return Number(saved?.currentIndex) || 0
    } catch {
      return 0
    }
  })
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(quizStorageKey) || 'null')
      return saved?.answers || {}
    } catch {
      return {}
    }
  })
  const [submitted, setSubmitted] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(quizStorageKey) || 'null')
      return Boolean(saved?.submitted)
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!mcqs.length) return
    const draft = {
      ownerKey: quizUserKey,
      currentIndex,
      answers,
      submitted,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(quizStorageKey, JSON.stringify(draft))
  }, [answers, currentIndex, mcqs.length, quizStorageKey, quizUserKey, submitted])

  const currentMcq = mcqs[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = mcqs.length ? Math.round(((currentIndex + 1) / mcqs.length) * 100) : 0
  const style = getSubjectStyle(subject?.name)

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

  const handleRetake = () => {
    localStorage.removeItem(quizStorageKey)
    setCurrentIndex(0)
    setAnswers({})
    setSubmitted(false)
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
            <div className="mcq-question-title">
              <MCQRenderer text={currentMcq.questionText || currentMcq.question} images={mcqQuestionImages(currentMcq)} />
            </div>
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
                    <div className="mcq-option-text">
                      <MCQRenderer text={option?.text || option} images={mcqOptionImages(currentMcq, option, String.fromCharCode(65 + index))} />
                    </div>
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
            <div className="inline-actions" style={{ marginTop: '20px', justifyContent: 'center', gap: '10px' }}>
              <button className="btn btn-primary" type="button" onClick={openReview}>Open Detailed Review</button>
              <button className="btn btn-secondary" type="button" onClick={handleRetake}>Retake Test</button>
              <Link className="btn btn-ghost" to={`/course/${subject.id}`} onClick={() => localStorage.removeItem(quizStorageKey)}>Practice Another Chapter</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
