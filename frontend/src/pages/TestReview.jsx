import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API from '../services/api'
import MCQRenderer from '../components/MCQRenderer'
import './TestReview.css'

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
  option?.image,
  option?.imageUrl,
  option?.imageUrls,
  option?.src,
  option?.url,
  mcq?.[`option${letter}Images`],
  mcq?.[`option${letter}Image`],
  mcq?.[`option${letter}ImageUrl`],
  mcq?.[`option${letter}ImageUrls`],
)

export default function TestReview() {
  const location = useLocation()
  const navigate = useNavigate()
  const reviewState = location.state

  const [savedStatus, setSavedStatus] = useState({})
  const [activeFilter, setActiveFilter] = useState(() => (reviewState?.result?.wrong > 0 ? 'wrong' : 'all'))
  const [expandedExplanations, setExpandedExplanations] = useState({})
  const [allExpanded, setAllExpanded] = useState(false)

  useEffect(() => {
    if (!reviewState?.result?.detailed) return
    const ids = reviewState.result.detailed.map(d => d.id)
    API.post('/flashcards/status', { mcqIds: ids })
      .then(res => setSavedStatus(res.data.savedStatus || {}))
      .catch(() => {})
  }, [reviewState])

  const toggleFlashcard = (mcqId) => {
    if (!reviewState?.subject || !reviewState?.chapter) return
    API.post('/flashcards/toggle', {
      mcqId,
      subject: reviewState.subject.name,
      chapterId: reviewState.chapter.id,
    })
      .then(res => {
        setSavedStatus(prev => ({ ...prev, [mcqId]: res.data.saved }))
        toast.success(res.data.saved ? 'Saved to Flashcards' : 'Removed from Flashcards')
      })
      .catch(() => toast.error('Could not save flashcard'))
  }

  const toggleExplanation = (id) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedExplanations({})
      setAllExpanded(false)
    } else {
      const next = {}
      ;(reviewState?.result?.detailed || []).forEach((item) => {
        next[String(item.id || item.mcqId)] = true
      })
      setExpandedExplanations(next)
      setAllExpanded(true)
    }
  }

  const filteredItems = useMemo(() => {
    const list = reviewState?.result?.detailed || []
    if (activeFilter === 'wrong') {
      return list.filter((item) => item.skipped || !item.isCorrect)
    }
    if (activeFilter === 'correct') {
      return list.filter((item) => item.isCorrect && !item.skipped)
    }
    if (activeFilter === 'skipped') {
      return list.filter((item) => item.skipped)
    }
    return list
  }, [activeFilter, reviewState?.result?.detailed])

  if (!reviewState?.result || !reviewState?.subject || !reviewState?.chapter) {
    return (
      <div className="workspace-page">
        <div className="empty-state">
          <div className="empty-orb" />
          <h3>Review data is unavailable</h3>
          <p>Start a practice set first, then open the detailed review page from the result summary.</p>
          <Link className="btn btn-primary" to="/courses">Back to Subjects</Link>
        </div>
      </div>
    )
  }

  const { subject, chapter, result } = reviewState
  const detailedList = result.detailed || []
  const wrongCount = result.wrong || detailedList.filter((item) => item.skipped || !item.isCorrect).length
  const correctCount = result.correct || detailedList.filter((item) => item.isCorrect && !item.skipped).length
  const skippedCount = result.skipped || detailedList.filter((item) => item.skipped).length

  return (
    <div className="mcq-review-page animate-fade-up">
      <section className="mcq-review-shell">
        <div className="mcq-review-top">
          <div>
            <div className="label-xs">{subject.name}</div>
            <h1>{chapter.name} Result Review</h1>
            <p>{result.correct} correct • {result.wrong} wrong • {result.percentage}% overall</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>Back</button>
        </div>

        <div className="review-stats-grid">
          <div className="review-stat-card review-stat-card--green"><span>Correct Answers</span><strong>{result.correct}</strong></div>
          <div className="review-stat-card review-stat-card--red"><span>Wrong Answers</span><strong>{result.wrong}</strong></div>
          <div className="review-stat-card review-stat-card--purple"><span>Percentage</span><strong>{result.percentage}%</strong></div>
        </div>

        {/* Top Filter Bar */}
        <div className="review-filter-bar">
          <div className="review-filter-tabs">
            <button
              type="button"
              className={`review-filter-tab review-filter-tab--wrong ${activeFilter === 'wrong' ? 'review-filter-tab--active' : ''}`}
              onClick={() => setActiveFilter('wrong')}
            >
              <span>❌ Wrong Answers Only</span>
              <strong>({wrongCount})</strong>
            </button>
            <button
              type="button"
              className={`review-filter-tab ${activeFilter === 'all' ? 'review-filter-tab--active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span>All Questions</span>
              <strong>({detailedList.length})</strong>
            </button>
            <button
              type="button"
              className={`review-filter-tab review-filter-tab--correct ${activeFilter === 'correct' ? 'review-filter-tab--active' : ''}`}
              onClick={() => setActiveFilter('correct')}
            >
              <span>✓ Correct</span>
              <strong>({correctCount})</strong>
            </button>
            {skippedCount > 0 && (
              <button
                type="button"
                className={`review-filter-tab ${activeFilter === 'skipped' ? 'review-filter-tab--active' : ''}`}
                onClick={() => setActiveFilter('skipped')}
              >
                <span>⚪ Skipped</span>
                <strong>({skippedCount})</strong>
              </button>
            )}
          </div>

          <div className="review-filter-actions">
            <button
              type="button"
              className="review-toggle-expl-btn"
              onClick={toggleExpandAll}
            >
              {allExpanded ? '▲ Collapse All Explanations' : '▼ Expand All Explanations'}
            </button>
          </div>
        </div>

        <div className="review-question-stack">
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--card-bg, #131b2e)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {activeFilter === 'wrong' ? (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                  <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Perfect Score! No Wrong Answers</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '1.25rem' }}>You answered every question correctly in this test!</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveFilter('all')}>
                    View All Questions ({detailedList.length})
                  </button>
                </div>
              ) : (
                <p className="text-muted">No questions match this filter.</p>
              )}
            </div>
          ) : null}

          {filteredItems.map((item, index) => {
            const itemId = String(item.id || item.mcqId)
            const isExpanded = Boolean(expandedExplanations[itemId])
            const qNum = item.originalQuestionNumber || item.questionNumber || (detailedList.indexOf(item) + 1)
            const correctLetter = String.fromCharCode(65 + item.correctIndex)
            const selectedLetter = item.skipped || item.selectedIndex < 0 ? null : String.fromCharCode(65 + item.selectedIndex)

            return (
              <article
                key={itemId}
                className={`review-compact-card ${item.skipped ? 'review-compact-card--skipped' : item.isCorrect ? 'review-compact-card--correct' : 'review-compact-card--wrong'}`}
              >
                <div className="review-compact-header">
                  <div className="review-compact-left">
                    <span className="review-compact-qnum">Question #{qNum}</span>
                    {item.subject && (
                      <span className={`flp-mcq-subject-badge flp-mcq-subject-badge--${String(item.subject).toLowerCase().replace(/[^a-z]/g, '')}`} style={{ marginBottom: 0, marginLeft: '6px' }}>
                        {item.subject}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleFlashcard(itemId)}
                      className="review-save-btn"
                      title="Save to Flashcards"
                    >
                      {savedStatus[itemId] ? '⭐ Saved' : '☆ Save'}
                    </button>
                  </div>

                  <div className="review-compact-status">
                    {item.isCorrect && !item.skipped ? (
                      <span className="review-compact-status--correct">
                        Official Key: Option {correctLetter} • ✓ Correct
                      </span>
                    ) : item.skipped ? (
                      <span className="review-compact-status--skipped">
                        Official Key: Option {correctLetter} • ⚪ Skipped
                      </span>
                    ) : (
                      <span className="review-compact-status--wrong">
                        Official Key: Option {correctLetter} • ✗ Your Answer: Option {selectedLetter}
                      </span>
                    )}
                  </div>
                </div>

                <div className="review-compact-statement">
                  <MCQRenderer text={item.questionText || item.question} images={mcqQuestionImages(item)} />
                </div>

                {/* 2-Column Options Grid */}
                <div className="review-compact-options-grid">
                  {item.options.map((option, optionIndex) => {
                    const letter = String.fromCharCode(65 + optionIndex)
                    const isCorrectOption = item.correctIndex === optionIndex
                    const isSelectedOption = item.selectedIndex === optionIndex
                    const isWrongSelected = isSelectedOption && !isCorrectOption

                    let pillClass = 'review-compact-pill'
                    if (isCorrectOption) pillClass += ' review-compact-pill--correct'
                    else if (isWrongSelected) pillClass += ' review-compact-pill--wrong'

                    return (
                      <div key={`${itemId}-${optionIndex}`} className={pillClass}>
                        <span className="review-compact-letter">{letter}</span>
                        <div className="review-compact-text">
                          <MCQRenderer text={option?.text || option} images={mcqOptionImages(item, option, letter)} />
                        </div>
                        {isCorrectOption && (
                          <span className="review-compact-tag review-compact-tag--correct">
                            {isSelectedOption ? '✓ Your Answer' : '✓ Correct'}
                          </span>
                        )}
                        {isWrongSelected && (
                          <span className="review-compact-tag review-compact-tag--wrong">
                            ✗ Your Answer
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Bottom Row: Toggle Explanation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="review-toggle-expl-btn"
                    onClick={() => toggleExplanation(itemId)}
                  >
                    {isExpanded ? '▲ Hide Explanation' : '▼ Show Explanation'}
                  </button>

                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                    Official Key: <strong style={{ color: '#10b981' }}>Option {correctLetter}</strong>
                  </span>
                </div>

                {/* Collapsible Explanation Box */}
                {isExpanded && (
                  <div className="review-compact-expl-box">
                    <div className="review-compact-expl-title">💡 Step-by-Step Solution:</div>
                    <MCQRenderer
                      text={item.explanationText || item.explanation || 'No explanation added yet.'}
                      images={mcqExplanationImages(item)}
                    />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
