import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './PlatformPages.css'
import {
  SUBJECT_STYLES,
  getChaptersBySubject,
  mdcatSubjects,
  teacherMcqSummary,
} from './platformContent'

function SubjectIcon({ subject }) {
  const paths = {
    Biology: 'M12 4c-4 0-7 3.5-7 8 0 3.8 2.2 6.5 7 8 4.8-1.5 7-4.2 7-8 0-4.5-3-8-7-8Zm0 0v16M8 9c1.2 1.4 2.4 2.1 4 2.1 1.7 0 2.9-.7 4-2.1',
    Chemistry: 'M10 3v6l-5.6 8.8A2 2 0 0 0 6.1 21h11.8a2 2 0 0 0 1.7-3.2L14 9V3M8.5 13h7',
    Physics: 'M12 3v4M12 17v4M4 12H0m24 0h-4M5.6 5.6 2.8 2.8m18.4 18.4-2.8-2.8M18.4 5.6l2.8-2.8M5.6 18.4l-2.8 2.8M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
    English: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16ZM9 7h6M9 11h6M9 15h4',
  }

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d={paths[subject]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StudentSubjects() {
  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card subject-browser-hero">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">MDCAT Practice</div>
            <h2 className="workspace-card-title">Choose a subject and continue chapter-wise MCQ practice</h2>
            <p>Only Biology, Chemistry, Physics, and English are available, with clear chapter separation and subject-wise tracking.</p>
          </div>
        </div>
      </section>

      <div className="workspace-columns-3">
        {mdcatSubjects.map((subject) => {
          const style = SUBJECT_STYLES[subject.name]
          return (
            <article key={subject.id} className={`subject-card subject-card--mdcat ${style.className}`}>
              <div className="subject-card-banner" style={{ background: style.banner }}>
                <div className="subject-card-banner-top">
                  <span className="subject-card-icon"><SubjectIcon subject={subject.name} /></span>
                  <div className="subject-card-banner-copy">
                    <div className="label-xs" style={{ color: 'rgba(255,255,255,0.88)' }}>{subject.name}</div>
                  </div>
                  <span className="state-chip state-chip--neutral">{subject.accuracy}% accuracy</span>
                </div>
                <p>{subject.description}</p>
              </div>

              <div className="subject-card-body">
                <div className="subject-stats-grid">
                  <div><span>Total Chapters</span><strong>{subject.totalChapters}</strong></div>
                  <div><span>Total MCQs</span><strong>{subject.totalMcqs}</strong></div>
                  <div><span>Attempted</span><strong>{subject.attemptedMcqs}</strong></div>
                  <div><span>Accuracy</span><strong>{subject.accuracy}%</strong></div>
                </div>
                <div className="progress-inline subject-progress">
                  <div className="progress-inline-row">
                    <span>Practice progress</span>
                    <strong>{subject.accuracy}%</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ '--fill': `${subject.accuracy}%`, width: `${subject.accuracy}%`, background: style.progress }} />
                  </div>
                </div>
                <div className="inline-actions" style={{ marginTop: '16px' }}>
                  <Link className="btn btn-primary btn-sm" style={{ height: '42px', borderRadius: '12px' }} to={`/course/${subject.id}`}>Continue Practice</Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function TeacherMcqManagement() {
  const [activePanel, setActivePanel] = useState('mcq')
  const formRef = useRef(null)
  const chapterOptions = useMemo(() => getChaptersBySubject('biology'), [])

  const openPanel = (panel) => {
    setActivePanel(panel)
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">MCQ Management</div>
            <h2 className="workspace-card-title">Manage subject banks, chapters, and explanations</h2>
          </div>
          <div className="inline-actions">
            <button className={`btn ${activePanel === 'mcq' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => openPanel('mcq')}>Add MCQ</button>
            <button className={`btn ${activePanel === 'chapter' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => openPanel('chapter')}>Add Chapter</button>
          </div>
        </div>
      </section>

      <div className="split-layout">
        <div className="list-stack">
          {teacherMcqSummary.map((subject) => (
            <div key={subject.subject} className="course-manage-card">
              <div className="workspace-card-head">
                <div>
                  <div className="label-xs">{subject.subject}</div>
                  <h3 className="workspace-card-title">{subject.mcqs} MCQs across {subject.chapters} chapters</h3>
                  <p>Uploaded and reviewed by {subject.uploadedBy}</p>
                </div>
                <span className="state-chip state-chip--neutral">Managed</span>
              </div>
              <div className="workspace-card-body">
                <div className="chapter-list">
                  {getChaptersBySubject(subject.subject.toLowerCase()).map((chapter) => (
                    <div key={chapter.id} className="chapter-item">
                      <div>
                        <strong>{chapter.name}</strong>
                        <p>{chapter.totalMcqs} MCQs • Best student score {chapter.bestScore}%</p>
                      </div>
                      <div className="inline-actions">
                        <button className="btn btn-secondary btn-sm" type="button">Edit</button>
                        <button className="btn btn-ghost btn-sm" type="button">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside ref={formRef} className="workspace-card drawer-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">{activePanel === 'mcq' ? 'Add MCQ' : 'Add Chapter'}</div>
              <h3 className="workspace-card-title">{activePanel === 'mcq' ? 'Teacher entry form' : 'Chapter setup form'}</h3>
            </div>
          </div>
          {activePanel === 'mcq' ? (
            <div className="workspace-card-body form-shell">
              <div className="floating-field"><label htmlFor="mcq-subject">Subject</label><select id="mcq-subject" defaultValue="Biology"><option>Biology</option><option>Chemistry</option><option>Physics</option><option>English</option></select></div>
              <div className="floating-field"><label htmlFor="mcq-chapter">Chapter</label><select id="mcq-chapter" defaultValue="Cell Biology">{chapterOptions.map((chapter) => <option key={chapter.id}>{chapter.name}</option>)}</select></div>
              <div className="floating-field"><label htmlFor="mcq-question">Question</label><textarea id="mcq-question" rows="4" defaultValue="Which organelle is primarily responsible for ATP production in eukaryotic cells?" /></div>
              <div className="floating-grid">
                <div className="floating-field"><label htmlFor="mcq-a">Option A</label><input id="mcq-a" type="text" defaultValue="Golgi apparatus" /></div>
                <div className="floating-field"><label htmlFor="mcq-b">Option B</label><input id="mcq-b" type="text" defaultValue="Mitochondrion" /></div>
                <div className="floating-field"><label htmlFor="mcq-c">Option C</label><input id="mcq-c" type="text" defaultValue="Ribosome" /></div>
                <div className="floating-field"><label htmlFor="mcq-d">Option D</label><input id="mcq-d" type="text" defaultValue="Lysosome" /></div>
              </div>
              <div className="floating-grid">
                <div className="floating-field"><label htmlFor="mcq-correct">Correct Answer</label><select id="mcq-correct" defaultValue="B"><option>A</option><option>B</option><option>C</option><option>D</option></select></div>
                <div className="floating-field"><label htmlFor="mcq-difficulty">Difficulty</label><select id="mcq-difficulty" defaultValue="Easy"><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
              </div>
              <div className="floating-field"><label htmlFor="mcq-explanation">Explanation</label><textarea id="mcq-explanation" rows="5" defaultValue="Mitochondria generate ATP through aerobic respiration, so they are known as the powerhouse of the cell." /></div>
              <button className="btn btn-primary" type="button">Save MCQ</button>
            </div>
          ) : (
            <div className="workspace-card-body form-shell">
              <div className="floating-field"><label htmlFor="chapter-subject">Subject</label><select id="chapter-subject" defaultValue="Biology"><option>Biology</option><option>Chemistry</option><option>Physics</option><option>English</option></select></div>
              <div className="floating-field"><label htmlFor="chapter-name">Chapter Name</label><input id="chapter-name" type="text" defaultValue="New Biology Chapter" /></div>
              <div className="floating-field"><label htmlFor="chapter-description">Description</label><textarea id="chapter-description" rows="5" defaultValue="Add a short chapter summary so teachers and students can understand the focus of this MCQ section instantly." /></div>
              <div className="floating-field"><label htmlFor="chapter-warning">Delete Rule</label><input id="chapter-warning" type="text" defaultValue="Delete only when no MCQs exist, otherwise show a warning." readOnly /></div>
              <button className="btn btn-primary" type="button">Save Chapter</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default function PlatformCourses() {
  const { user } = useAuth()
  if (user?.role === 'teacher') return <TeacherMcqManagement />
  return <StudentSubjects />
}
