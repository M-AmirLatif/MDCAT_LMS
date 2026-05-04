import { Link, useParams } from 'react-router-dom'
import './PlatformPages.css'
import { getChaptersBySubject, getSubjectById, SUBJECT_STYLES } from './platformContent'

export default function CourseDetail() {
  const { courseId } = useParams()
  const subject = getSubjectById(courseId)

  if (!subject) {
    return (
      <div className="workspace-page">
        <div className="empty-state">
          <div className="empty-orb" />
          <h3>Subject not found</h3>
          <p>Return to the MDCAT subject list and choose Biology, Chemistry, Physics, or English.</p>
          <Link className="btn btn-primary" to="/courses">Back to Subjects</Link>
        </div>
      </div>
    )
  }

  const chapters = getChaptersBySubject(courseId)
  const style = SUBJECT_STYLES[subject.name]

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card subject-detail-hero">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs" style={{ color: style.accent }}>{subject.name}</div>
            <h2 className="workspace-card-title">{subject.description}</h2>
            <p>{subject.totalChapters} chapters • {subject.totalMcqs} total MCQs • {subject.attemptedMcqs} attempted • {subject.accuracy}% accuracy</p>
          </div>
          <Link className="btn btn-secondary" to="/courses">Back to Subjects</Link>
        </div>
      </section>

      <div className="chapter-browser-grid">
        {chapters.map((chapter) => (
          <article key={chapter.id} className={`workspace-card chapter-practice-card ${style.className}`}>
            <div className="workspace-card-head">
              <div>
                <div className="label-xs" style={{ color: style.accent }}>{subject.name}</div>
                <h3 className="workspace-card-title">{chapter.name}</h3>
                <p>{chapter.description}</p>
              </div>
              <span className={`state-chip ${chapter.attemptedCount > 0 ? 'state-chip--neutral' : 'state-chip--warning'}`}>
                {chapter.attemptedCount > 0 ? 'Continue' : 'Start'}
              </span>
            </div>
            <div className="workspace-card-body">
              <div className="subject-stats-grid">
                <div><span>MCQs</span><strong>{chapter.totalMcqs}</strong></div>
                <div><span>Attempted</span><strong>{chapter.attemptedCount}</strong></div>
                <div><span>Best Score</span><strong>{chapter.bestScore}%</strong></div>
                <div><span>Status</span><strong>{chapter.attemptedCount > 0 ? 'In Progress' : 'Fresh'}</strong></div>
              </div>
              <div className="inline-actions" style={{ marginTop: '18px' }}>
                <Link className="btn btn-primary btn-sm" style={{ height: '42px', borderRadius: '12px' }} to={`/course/${subject.id}/mcqs?chapter=${chapter.id}`}>
                  {chapter.attemptedCount > 0 ? 'Continue Practice' : 'Start Practice'}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {chapters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-orb" />
          <h3>No chapters added yet</h3>
          <p>Teachers will add real chapters and MCQs for {subject.name}. Check back after content is published.</p>
          <Link className="btn btn-secondary" to="/courses">Back to Subjects</Link>
        </div>
      ) : null}
    </div>
  )
}
