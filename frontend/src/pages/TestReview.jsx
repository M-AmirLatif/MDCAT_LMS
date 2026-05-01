import { Link, useLocation, useNavigate } from 'react-router-dom'
import './TestReview.css'

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
              <h3>{item.question}</h3>

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
                      <span>{option}</span>
                      {selected ? <span className="review-option-tag">Your answer</span> : null}
                      {correct ? <span className="review-option-tag review-option-tag--correct">Correct answer</span> : null}
                    </div>
                  )
                })}
              </div>

              <div className="review-explanation-box">
                <strong>Explanation</strong>
                <p>{item.explanation}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
