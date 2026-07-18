import { Link, useLocation, useNavigate } from 'react-router-dom'
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

        <div className="review-question-stack">
          {result.detailed.map((item, index) => (
            <article key={item.id} className={`review-question-card ${item.isCorrect ? 'review-question-card--correct' : 'review-question-card--wrong'}`}>
              <div className="review-question-top">
                <span className="review-question-number">Question {index + 1}</span>
                <span className={`state-chip ${item.isCorrect ? 'state-chip--success' : 'state-chip--warning'}`}>
                  {item.isCorrect ? 'Correct' : 'Needs Review'}
                </span>
              </div>
              <div className="review-question-title">
                <MCQRenderer text={item.questionText || item.question} images={mcqQuestionImages(item)} />
              </div>

              <div className="review-options-list">
                {item.options.map((option, optionIndex) => {
                  const correct = item.correctIndex === optionIndex
                  const selected = item.selectedIndex === optionIndex
                  return (
                    <div
                      key={`${item.id}-${option}`}
                      className={`review-option-row ${correct ? 'review-option-row--correct' : ''} ${selected && !correct ? 'review-option-row--wrong' : ''}`}
                    >
                      <span className="review-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                      <div className="review-option-text">
                        <MCQRenderer text={option?.text || option} images={mcqOptionImages(item, option, String.fromCharCode(65 + optionIndex))} />
                      </div>
                      {selected ? <span className="review-option-tag">Your answer</span> : null}
                      {correct ? <span className="review-option-tag review-option-tag--correct">Correct answer</span> : null}
                    </div>
                  )
                })}
              </div>

              <div className="review-explanation-box">
                <strong>Explanation</strong>
                <div className="review-explanation-text">
                  <MCQRenderer text={item.explanationText || item.explanation || 'No explanation added yet.'} images={mcqExplanationImages(item)} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
