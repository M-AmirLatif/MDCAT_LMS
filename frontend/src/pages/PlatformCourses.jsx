import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import './PlatformPages.css'
import {
  SUBJECT_STYLES,
  getChaptersBySubject,
  getMcqsByChapter,
  mdcatSubjects,
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
            <div className="label-xs">MDCAT MCQ Bank</div>
            <h2 className="workspace-card-title">Choose a subject, open chapters, then attempt MCQs</h2>
            <p>Biology, Chemistry, Physics, and English are separated into chapter-wise practice banks with scoring and explanations.</p>
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
                  <Link className="btn btn-primary btn-sm" style={{ height: '42px', borderRadius: '12px' }} to={`/course/${subject.id}`}>Open Chapters</Link>
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
  const [selectedSubjectId, setSelectedSubjectId] = useState('biology')
  const [selectedChapterId, setSelectedChapterId] = useState('bio-cell')
  const formRef = useRef(null)

  const selectedSubject = mdcatSubjects.find((subject) => subject.id === selectedSubjectId) || mdcatSubjects[0]
  const selectedStyle = SUBJECT_STYLES[selectedSubject.name]
  const chapterOptions = useMemo(() => getChaptersBySubject(selectedSubjectId), [selectedSubjectId])
  const selectedChapter = chapterOptions.find((chapter) => chapter.id === selectedChapterId) || chapterOptions[0]
  const selectedMcqs = useMemo(
    () => getMcqsByChapter(selectedSubjectId, selectedChapter?.id),
    [selectedChapter?.id, selectedSubjectId],
  )

  const scrollToForm = () => {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const openPanel = (panel) => {
    setActivePanel(panel)
    scrollToForm()
  }

  const chooseSubject = (subjectId) => {
    const chapters = getChaptersBySubject(subjectId)
    setSelectedSubjectId(subjectId)
    setSelectedChapterId(chapters[0]?.id || '')
  }

  const chooseChapter = (chapterId) => {
    setSelectedChapterId(chapterId)
    setActivePanel('mcq')
    scrollToForm()
  }

  const handleSave = (type) => {
    toast.success(type === 'chapter' ? 'Chapter fields are ready for backend save.' : 'MCQ fields are ready for backend save.')
  }

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Teacher MCQ Bank</div>
            <h2 className="workspace-card-title">Manage subjects, chapters, MCQs, correct answers, and explanations</h2>
            <p>Click a subject, click a chapter, then use the empty form fields to add MCQs or create new chapters.</p>
          </div>
          <div className="inline-actions">
            <button className={`btn ${activePanel === 'mcq' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => openPanel('mcq')}>Add MCQ</button>
            <button className={`btn ${activePanel === 'chapter' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => openPanel('chapter')}>Add Chapter</button>
          </div>
        </div>
      </section>

      <div className="workspace-columns-4">
        {mdcatSubjects.map((subject) => {
          const style = SUBJECT_STYLES[subject.name]
          const active = selectedSubjectId === subject.id
          return (
            <button
              key={subject.id}
              className={`teacher-subject-bank teacher-subject-bank--button ${style.className} ${active ? 'teacher-subject-bank--active' : ''}`}
              type="button"
              onClick={() => chooseSubject(subject.id)}
            >
              <div className="subject-focus-head">
                <span className={`subject-focus-icon subject-focus-icon--${subject.id}`}>
                  <SubjectIcon subject={subject.name} />
                </span>
                <div>
                  <div className="label-xs" style={{ color: style.accent }}>{subject.name}</div>
                  <h4>{subject.totalChapters} Chapters</h4>
                </div>
              </div>
              <div className="metric-row">
                <span>Total MCQs</span>
                <strong>{subject.totalMcqs}</strong>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ '--fill': '100%', width: '100%', background: style.progress }} />
              </div>
            </button>
          )
        })}
      </div>

      <div className="split-layout">
        <div className="teacher-hierarchy">
          <section className="workspace-card">
            <div className="workspace-card-head">
              <div>
                <div className="label-xs" style={{ color: selectedStyle.accent }}>{selectedSubject.name} Chapters</div>
                <h3 className="workspace-card-title">Select a chapter to manage MCQs</h3>
                <p>{chapterOptions.length} chapters available in this course.</p>
              </div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => openPanel('chapter')}>Add Chapter</button>
            </div>
            <div className="workspace-card-body">
              <div className="chapter-list">
                {chapterOptions.map((chapter) => (
                  <button
                    key={chapter.id}
                    className={`chapter-item chapter-item--button ${selectedChapterId === chapter.id ? 'chapter-item--active' : ''}`}
                    type="button"
                    onClick={() => chooseChapter(chapter.id)}
                  >
                    <div>
                      <strong>{chapter.name}</strong>
                      <p>{chapter.totalMcqs} MCQs - Best score {chapter.bestScore}%</p>
                    </div>
                    <span className="btn btn-secondary btn-sm">Open</span>
                  </button>
                ))}
                {chapterOptions.length === 0 ? (
                  <div className="empty-state empty-state--compact">
                    <div className="empty-orb" />
                    <h3>No chapters yet</h3>
                    <p>Create the first real chapter for {selectedSubject.name}, then add MCQs under it.</p>
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => openPanel('chapter')}>Add Chapter</button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="workspace-card">
            <div className="workspace-card-head">
              <div>
                <div className="label-xs" style={{ color: selectedStyle.accent }}>{selectedChapter?.name || 'Chapter'}</div>
                <h3 className="workspace-card-title">Chapter MCQs</h3>
                <p>Click Add MCQ for empty fields after selecting a real chapter.</p>
              </div>
              <div className="inline-actions">
                <button className="btn btn-primary btn-sm" type="button" onClick={() => openPanel('mcq')}>Add MCQ</button>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => openPanel('mcq')}>Edit MCQs</button>
              </div>
            </div>
            <div className="workspace-card-body">
              <div className="teacher-mcq-list">
                {selectedMcqs.map((mcq, index) => (
                  <article key={mcq.id} className="teacher-mcq-row">
                    <div>
                      <span className="state-chip state-chip--neutral">Q{index + 1}</span>
                      <h4>{mcq.question}</h4>
                      <p>Correct answer: {mcq.correctAnswer} - {mcq.difficulty}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => openPanel('mcq')}>Edit</button>
                  </article>
                ))}
                {selectedMcqs.length === 0 ? (
                  <div className="empty-state empty-state--compact">
                    <div className="empty-orb" />
                    <h3>No MCQs yet</h3>
                    <p>Add the first MCQ for this chapter.</p>
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => openPanel('mcq')}>Add MCQ</button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <aside ref={formRef} className="workspace-card drawer-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">{activePanel === 'mcq' ? 'Add MCQ' : 'Add Chapter'}</div>
              <h3 className="workspace-card-title">
                {activePanel === 'mcq' ? `${selectedSubject.name} - ${selectedChapter?.name || 'Select chapter'}` : `${selectedSubject.name} chapter setup`}
              </h3>
            </div>
          </div>
          {activePanel === 'mcq' ? (
            <div className="workspace-card-body form-shell">
              <div className="teacher-form-context" style={{ borderColor: selectedStyle.accent }}>
                <strong>{selectedSubject.name} MCQ Bank</strong>
                <span>{selectedChapter?.name || 'Choose a chapter'} - add a clean MDCAT-style question with explanation.</span>
              </div>
              <div className="floating-field"><label htmlFor="mcq-subject">Subject</label><select id="mcq-subject" value={selectedSubjectId} onChange={(event) => chooseSubject(event.target.value)}>{mdcatSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
              <div className="floating-field"><label htmlFor="mcq-chapter">Chapter</label><select id="mcq-chapter" value={selectedChapter?.id || ''} onChange={(event) => setSelectedChapterId(event.target.value)}>{chapterOptions.length === 0 ? <option value="">Create a chapter first</option> : chapterOptions.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}</select></div>
              <div className="floating-field"><label htmlFor="mcq-question">Question</label><textarea id="mcq-question" rows="4" placeholder="Type the MCQ question here..." /></div>
              <div className="floating-grid">
                <div className="floating-field"><label htmlFor="mcq-a">Option A</label><input id="mcq-a" type="text" placeholder="Enter option A" /></div>
                <div className="floating-field"><label htmlFor="mcq-b">Option B</label><input id="mcq-b" type="text" placeholder="Enter option B" /></div>
                <div className="floating-field"><label htmlFor="mcq-c">Option C</label><input id="mcq-c" type="text" placeholder="Enter option C" /></div>
                <div className="floating-field"><label htmlFor="mcq-d">Option D</label><input id="mcq-d" type="text" placeholder="Enter option D" /></div>
              </div>
              <div className="floating-grid">
                <div className="floating-field"><label htmlFor="mcq-correct">Correct Answer</label><select id="mcq-correct" defaultValue="A"><option>A</option><option>B</option><option>C</option><option>D</option></select></div>
                <div className="floating-field"><label htmlFor="mcq-difficulty">Difficulty</label><select id="mcq-difficulty" defaultValue="Easy"><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
              </div>
              <div className="floating-field"><label htmlFor="mcq-explanation">Explanation</label><textarea id="mcq-explanation" rows="5" placeholder="Write a short explanation students will see after submission..." /></div>
              <button className="btn btn-primary" type="button" onClick={() => handleSave('mcq')}>Save MCQ</button>
            </div>
          ) : (
            <div className="workspace-card-body form-shell">
              <div className="teacher-form-context" style={{ borderColor: selectedStyle.accent }}>
                <strong>{selectedSubject.name} Chapter Bank</strong>
                <span>Create a new chapter section before adding MCQs.</span>
              </div>
              <div className="floating-field"><label htmlFor="chapter-subject">Subject</label><select id="chapter-subject" value={selectedSubjectId} onChange={(event) => chooseSubject(event.target.value)}>{mdcatSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
              <div className="floating-field"><label htmlFor="chapter-name">Chapter Name</label><input id="chapter-name" type="text" placeholder="Enter chapter name" /></div>
              <div className="floating-field"><label htmlFor="chapter-description">Description</label><textarea id="chapter-description" rows="5" placeholder="Add a short chapter summary for students and teachers..." /></div>
              <div className="floating-field"><label htmlFor="chapter-warning">Delete Rule</label><input id="chapter-warning" type="text" value="Delete only when no MCQs exist, otherwise show a warning." readOnly /></div>
              <button className="btn btn-primary" type="button" onClick={() => handleSave('chapter')}>Save Chapter</button>
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
