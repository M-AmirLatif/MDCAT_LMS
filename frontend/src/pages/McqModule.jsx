import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import './PlatformPages.css'
import './MCQTest.css'
import './TestReview.css'

const SUBJECTS = [
  { id: 'biology', name: 'Biology', accent: '#1DB884', progress: 'linear-gradient(135deg,#1DB884,#2DD99B)' },
  { id: 'chemistry', name: 'Chemistry', accent: '#6C47FF', progress: 'linear-gradient(135deg,#6C47FF,#1DB884)' },
  { id: 'physics', name: 'Physics', accent: '#4A90E2', progress: 'linear-gradient(135deg,#4A90E2,#6AABFF)' },
  { id: 'english', name: 'English', accent: '#F59E0B', progress: 'linear-gradient(135deg,#F59E0B,#FBB040)' },
]

const emptyMcqForm = {
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: '',
}

function subjectById(id) {
  return SUBJECTS.find((subject) => subject.id === String(id || '').toLowerCase())
}

function SubjectIcon({ subject }) {
  const paths = {
    Biology: 'M12 4c-4 0-7 3.5-7 8 0 3.8 2.2 6.5 7 8 4.8-1.5 7-4.2 7-8 0-4.5-3-8-7-8Zm0 0v16M8 9c1.2 1.4 2.4 2.1 4 2.1 1.7 0 2.9-.7 4-2.1',
    Chemistry: 'M10 3v6l-5.6 8.8A2 2 0 0 0 6.1 21h11.8a2 2 0 0 0 1.7-3.2L14 9V3M8.5 13h7',
    Physics: 'M12 3v4M12 17v4M4 12H0m24 0h-4M5.6 5.6 2.8 2.8m18.4 18.4-2.8-2.8M18.4 5.6l2.8-2.8M5.6 18.4l-2.8 2.8M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
    English: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16ZM9 7h6M9 11h6M9 15h4',
  }
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path d={paths[subject]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LoadingCard({ label = 'Loading...' }) {
  return (
    <div className="workspace-card">
      <div className="workspace-card-body">
        <div className="skeleton-line" />
        <p>{label}</p>
      </div>
    </div>
  )
}

function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-orb" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="mcq-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="mcq-modal workspace-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">MCQ Bank</div>
            <h3 className="workspace-card-title">{title}</h3>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="workspace-card-body">{children}</div>
      </section>
    </div>
  )
}

function CourseSelection() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    API.get('/mcqs/subjects/summary')
      .then((res) => {
        if (alive) setSubjects(res.data.subjects || [])
      })
      .catch((error) => toast.error(error.response?.data?.error || 'Unable to load subjects'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const merged = SUBJECTS.map((subject) => ({
    ...subject,
    ...(subjects.find((item) => item.id === subject.id) || {}),
  }))

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card subject-browser-hero">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">MDCAT MCQ Bank</div>
            <h2 className="workspace-card-title">Courses → Chapters → MCQs → Quiz Attempt → Result</h2>
            <p>Select one of the four MDCAT subjects. Chapters and questions open step by step.</p>
          </div>
        </div>
      </section>

      {loading ? <LoadingCard label="Loading subject bank..." /> : null}
      <div className="workspace-columns-4 mcq-subject-grid">
        {merged.map((subject) => (
          <Link key={subject.id} className="workspace-card mcq-subject-card" to={`/mcqs/${subject.id}`} style={{ '--subject': subject.accent }}>
            <div className="mcq-subject-card-top">
              <span className="mcq-subject-icon"><SubjectIcon subject={subject.name} /></span>
              <div>
                <div className="label-xs" style={{ color: subject.accent }}>{subject.name}</div>
                <h3 className="workspace-card-title">{subject.name}</h3>
              </div>
            </div>
            <div className="subject-stats-grid">
              <div><span>Total Chapters</span><strong>{subject.totalChapters || 0}</strong></div>
              <div><span>Total MCQs</span><strong>{subject.totalMcqs || 0}</strong></div>
            </div>
            <span className="btn btn-primary btn-sm">Open Chapters</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ChapterForm({ initial, onSubmit }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')

  return (
    <form className="form-shell" onSubmit={(event) => { event.preventDefault(); onSubmit({ name, description }) }}>
      <div className="floating-field"><label htmlFor="chapter-name">Chapter Name</label><input id="chapter-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Topic 1 - Cell Structure & Membrane" /></div>
      <div className="floating-field"><label htmlFor="chapter-description">Description</label><textarea id="chapter-description" rows="4" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short chapter description for students." /></div>
      <button className="btn btn-primary" type="submit">Save Chapter</button>
    </form>
  )
}

function ChapterList() {
  const { subject } = useParams()
  const { isTeacher } = useAuth()
  const meta = subjectById(subject)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await API.get(`/mcqs/${subject}/chapters`)
      setChapters(res.data.chapters || [])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to load chapters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [subject]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!meta) return <EmptyState title="Subject not found" text="Choose Biology, Chemistry, Physics, or English." action={<Link className="btn btn-primary" to="/mcqs">Back to Subjects</Link>} />

  const saveChapter = async (payload) => {
    try {
      if (modal?.chapter) {
        await API.put(`/mcqs/${subject}/chapters/${modal.chapter.id}`, payload)
        toast.success('Chapter updated')
      } else {
        await API.post(`/mcqs/${subject}/chapters`, payload)
        toast.success('Chapter added')
      }
      setModal(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to save chapter')
    }
  }

  const deleteChapter = async (chapter) => {
    if (!window.confirm(`Delete "${chapter.name}"? This only works when the chapter has no MCQs.`)) return
    try {
      await API.delete(`/mcqs/${subject}/chapters/${chapter.id}`)
      toast.success('Chapter deleted')
      load()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to delete chapter')
    }
  }

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs" style={{ color: meta.accent }}>Subject &gt; Chapters</div>
            <h2 className="workspace-card-title">{meta.name} Chapters</h2>
            <p>Open a chapter to view MCQs. Teachers can add, rename, or delete empty chapters.</p>
          </div>
          <div className="inline-actions">
            <Link className="btn btn-secondary" to="/mcqs">Back to Subjects</Link>
            {isTeacher ? <button className="btn btn-primary" type="button" onClick={() => setModal({ type: 'chapter' })}>Add Chapter</button> : null}
          </div>
        </div>
      </section>

      {loading ? <LoadingCard label="Loading chapters..." /> : null}
      <div className="chapter-browser-grid">
        {chapters.map((chapter) => (
          <article key={chapter.id} className="workspace-card chapter-practice-card">
            <div className="workspace-card-head">
              <div>
                <div className="label-xs" style={{ color: meta.accent }}>{meta.name}</div>
                <h3 className="workspace-card-title">{chapter.name}</h3>
                <p>{chapter.description || 'Chapter-wise MCQ practice bank.'}</p>
              </div>
              <span className="state-chip state-chip--neutral">{chapter.mcqCount || 0} MCQs</span>
            </div>
            <div className="workspace-card-body">
              <div className="inline-actions">
                <Link className="btn btn-primary btn-sm" to={`/mcqs/${subject}/${chapter.id}`}>Open MCQs</Link>
                {isTeacher ? <button className="btn btn-secondary btn-sm" type="button" onClick={() => setModal({ type: 'chapter', chapter })}>Edit</button> : null}
                {isTeacher ? <button className="btn btn-ghost btn-sm" type="button" onClick={() => deleteChapter(chapter)}>Delete</button> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!loading && chapters.length === 0 ? (
        <EmptyState
          title="No chapters added yet"
          text={`Teachers will add real ${meta.name} chapters before students can practice.`}
          action={isTeacher ? <button className="btn btn-primary" type="button" onClick={() => setModal({ type: 'chapter' })}>Add First Chapter</button> : <Link className="btn btn-secondary" to="/mcqs">Back to Subjects</Link>}
        />
      ) : null}
      {modal ? <Modal title={modal.chapter ? 'Edit Chapter' : 'Add Chapter'} onClose={() => setModal(null)}><ChapterForm initial={modal.chapter} onSubmit={saveChapter} /></Modal> : null}
    </div>
  )
}

function mcqToForm(mcq) {
  const byLetter = ['A', 'B', 'C', 'D'].map((letter, index) => ({
    letter,
    text: mcq.options?.[index]?.text || '',
  }))
  return {
    question: mcq.question || '',
    optionA: byLetter[0].text,
    optionB: byLetter[1].text,
    optionC: byLetter[2].text,
    optionD: byLetter[3].text,
    correctAnswer: mcq.correctAnswer || 'A',
    explanation: mcq.explanation || '',
  }
}

function McqForm({ initial, onSubmit }) {
  const [form, setForm] = useState(initial ? mcqToForm(initial) : emptyMcqForm)
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <form className="form-shell" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
      <div className="floating-field"><label htmlFor="question">Question statement</label><textarea id="question" rows="4" value={form.question} onChange={(event) => setField('question', event.target.value)} placeholder="Type the MDCAT question..." /></div>
      <div className="floating-grid">
        <div className="floating-field"><label htmlFor="option-a">Option A</label><input id="option-a" value={form.optionA} onChange={(event) => setField('optionA', event.target.value)} /></div>
        <div className="floating-field"><label htmlFor="option-b">Option B</label><input id="option-b" value={form.optionB} onChange={(event) => setField('optionB', event.target.value)} /></div>
        <div className="floating-field"><label htmlFor="option-c">Option C</label><input id="option-c" value={form.optionC} onChange={(event) => setField('optionC', event.target.value)} /></div>
        <div className="floating-field"><label htmlFor="option-d">Option D</label><input id="option-d" value={form.optionD} onChange={(event) => setField('optionD', event.target.value)} /></div>
      </div>
      <div className="floating-field"><label htmlFor="correct-answer">Correct Answer</label><select id="correct-answer" value={form.correctAnswer} onChange={(event) => setField('correctAnswer', event.target.value)}><option>A</option><option>B</option><option>C</option><option>D</option></select></div>
      <div className="floating-field"><label htmlFor="explanation">Explanation / Description</label><textarea id="explanation" rows="5" value={form.explanation} onChange={(event) => setField('explanation', event.target.value)} placeholder="Explanation students see after submission." /></div>
      <button className="btn btn-primary" type="submit">Save MCQ</button>
    </form>
  )
}

function TeacherMcqEditor({ mcq, index, chapter, chapterId, meta, onSaved, onDelete }) {
  const [form, setForm] = useState(() => mcqToForm(mcq))
  const [saving, setSaving] = useState(false)
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const saveInline = async () => {
    setSaving(true)
    try {
      const options = ['A', 'B', 'C', 'D'].map((letter) => ({
        text: form[`option${letter}`],
        isCorrect: form.correctAnswer === letter,
      }))
      await API.put(`/mcqs/${mcq._id}`, {
        question: form.question,
        options,
        explanation: form.explanation,
        correctAnswer: form.correctAnswer,
        topic: chapter?.name,
        chapterName: chapter?.name,
        chapterId,
        subject: meta?.name,
        isPublished: true,
      })
      toast.success(`Q${index + 1} saved`)
      onSaved()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to save MCQ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="teacher-mcq-row teacher-mcq-row--editor">
      <div className="teacher-mcq-editor-head">
        <span className="state-chip state-chip--neutral">Q{index + 1}</span>
        <span className="teacher-mcq-status">Correct answer: {form.correctAnswer}</span>
      </div>
      <div className="floating-field teacher-mcq-question-field">
        <label htmlFor={`mcq-question-${mcq._id}`}>Question statement</label>
        <textarea id={`mcq-question-${mcq._id}`} rows="3" value={form.question} onChange={(event) => setField('question', event.target.value)} />
      </div>
      <div className="teacher-mcq-option-grid">
        {['A', 'B', 'C', 'D'].map((letter) => (
          <div className={`teacher-mcq-option-field ${form.correctAnswer === letter ? 'teacher-mcq-option-field--correct' : ''}`} key={letter}>
            <label htmlFor={`mcq-${mcq._id}-${letter}`}>Option {letter}</label>
            <input id={`mcq-${mcq._id}-${letter}`} value={form[`option${letter}`]} onChange={(event) => setField(`option${letter}`, event.target.value)} />
          </div>
        ))}
      </div>
      <div className="teacher-mcq-editor-bottom">
        <div className="floating-field">
          <label htmlFor={`mcq-correct-${mcq._id}`}>Correct Answer</label>
          <select id={`mcq-correct-${mcq._id}`} value={form.correctAnswer} onChange={(event) => setField('correctAnswer', event.target.value)}>
            <option>A</option><option>B</option><option>C</option><option>D</option>
          </select>
        </div>
        <div className="floating-field">
          <label htmlFor={`mcq-explanation-${mcq._id}`}>Explanation / Description</label>
          <textarea id={`mcq-explanation-${mcq._id}`} rows="3" value={form.explanation} onChange={(event) => setField('explanation', event.target.value)} placeholder="Add explanation for students." />
        </div>
      </div>
      <div className="teacher-mcq-action-row">
        <button className="btn btn-primary btn-sm" type="button" onClick={saveInline} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => onDelete(mcq)}>Delete MCQ</button>
      </div>
    </article>
  )
}

function McqList() {
  const { subject, chapterId } = useParams()
  const { isTeacher } = useAuth()
  const meta = subjectById(subject)
  const [chapter, setChapter] = useState(null)
  const [mcqs, setMcqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const fileRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await API.get(`/mcqs/${subject}/${chapterId}`)
      setChapter(res.data.chapter)
      setMcqs(res.data.mcqs || [])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to load MCQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [subject, chapterId]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveMcq = async (payload) => {
    try {
      if (modal?.mcq) {
        const options = ['A', 'B', 'C', 'D'].map((letter) => ({
          text: payload[`option${letter}`],
          isCorrect: payload.correctAnswer === letter,
        }))
        await API.put(`/mcqs/${modal.mcq._id}`, {
          question: payload.question,
          options,
          explanation: payload.explanation,
          correctAnswer: payload.correctAnswer,
          topic: chapter?.name,
          chapterName: chapter?.name,
          chapterId,
          subject: meta?.name,
          isPublished: true,
        })
        toast.success('MCQ updated')
      } else {
        await API.post(`/mcqs/${subject}/${chapterId}`, payload)
        toast.success('MCQ added')
      }
      setModal(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to save MCQ')
    }
  }

  const deleteMcq = async (mcq) => {
    if (!window.confirm('Delete this MCQ?')) return
    try {
      await API.delete(`/mcqs/${mcq._id}`)
      toast.success('MCQ deleted')
      load()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to delete MCQ')
    }
  }

  const uploadCsv = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const csvText = await file.text()
      const res = await API.post(`/mcqs/${subject}/${chapterId}/upload-csv`, { csvText })
      toast.success(res.data.message)
      if (res.data.skipped?.length) {
        toast.error(res.data.skipped.map((row) => `Row ${row.row}: ${row.reason}`).join('\n'), { duration: 8000 })
      }
      load()
    } catch (error) {
      toast.error(error.response?.data?.error || 'CSV upload failed')
    } finally {
      event.target.value = ''
    }
  }

  if (!meta) return <EmptyState title="Subject not found" text="Choose Biology, Chemistry, Physics, or English." action={<Link className="btn btn-primary" to="/mcqs">Back to Subjects</Link>} />
  const totalSeconds = mcqs.length * 50
  const formattedTime = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs" style={{ color: meta.accent }}>{meta.name} &gt; {chapter?.name || 'Chapter'} &gt; MCQs</div>
            <h2 className="workspace-card-title">{chapter?.name || 'Chapter'} MCQs</h2>
            <p>{isTeacher ? 'Manage questions, answers, explanations, or upload a CSV.' : 'Start a quiz when MCQs are available.'}</p>
          </div>
          <div className="inline-actions">
            <Link className="btn btn-secondary" to={`/mcqs/${subject}`}>Back to Chapters</Link>
            {isTeacher ? <button className="btn btn-primary" type="button" onClick={() => setModal({ type: 'mcq' })}>Add MCQ</button> : null}
            {isTeacher ? <button className="btn btn-secondary" type="button" onClick={() => fileRef.current?.click()}>Upload CSV</button> : null}
            {!isTeacher ? <Link className="btn btn-primary" to={`/mcqs/${subject}/${chapterId}/attempt`}>Start Quiz</Link> : null}
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={uploadCsv} />
        </div>
      </section>

      {loading ? <LoadingCard label="Loading MCQs..." /> : null}
      <div className="workspace-card">
        <div className="workspace-card-body">
          {isTeacher ? (
            <div className="teacher-mcq-list teacher-mcq-list--editable">
              {mcqs.map((mcq, index) => (
                <TeacherMcqEditor key={mcq._id} mcq={mcq} index={index} chapter={chapter} chapterId={chapterId} meta={meta} onSaved={load} onDelete={deleteMcq} />
              ))}
            </div>
          ) : (
            <>
              <div className="student-quiz-summary-grid">
                <div className="student-quiz-summary-card">
                  <span className="student-quiz-summary-icon">?</span>
                  <div><small>Total MCQs</small><strong>{mcqs.length}</strong></div>
                </div>
                <div className="student-quiz-summary-card">
                  <span className="student-quiz-summary-icon student-quiz-summary-icon--timer">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" /><path d="M9 2h6M12 7v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <div><small>Quiz Time</small><strong>{formattedTime}</strong></div>
                </div>
                <div className="student-quiz-summary-card">
                  <span className="student-quiz-summary-icon">50s</span>
                  <div><small>Per MCQ</small><strong>50 sec</strong></div>
                </div>
              </div>
              {mcqs.length > 0 ? (
                <div className="student-quiz-motivation">
                  <div className="student-quiz-motivation-copy">
                    <span className="student-quiz-motivation-kicker">Practice mindset</span>
                    <h3>One focused attempt can expose your weak spots before the exam does.</h3>
                    <p>Answer calmly, skip what blocks you, then review every explanation. Chapter practice improves accuracy faster than random revision.</p>
                  </div>
                  <div className="student-quiz-motivation-steps" aria-label="Practice approach">
                    <span><b>1</b> Attempt every MCQ</span>
                    <span><b>2</b> Mark difficult questions</span>
                    <span><b>3</b> Review explanations</span>
                  </div>
                  <Link className="btn btn-primary" to={`/mcqs/${subject}/${chapterId}/attempt`}>Start focused practice</Link>
                </div>
              ) : null}
            </>
          )}
          {!loading && mcqs.length === 0 ? (
            <EmptyState
              title="No MCQs in this chapter yet"
              text="Teachers will add real questions with correct answers and explanations."
              action={isTeacher ? <button className="btn btn-primary" type="button" onClick={() => setModal({ type: 'mcq' })}>Add First MCQ</button> : null}
            />
          ) : null}
        </div>
      </div>
      {modal ? <Modal title={modal.mcq ? 'Edit MCQ' : 'Add MCQ'} onClose={() => setModal(null)}><McqForm initial={modal.mcq} onSubmit={saveMcq} /></Modal> : null}
    </div>
  )
}

function QuizAttempt() {
  const { subject, chapterId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const meta = subjectById(subject)
  const [chapter, setChapter] = useState(null)
  const [mcqs, setMcqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [skipped, setSkipped] = useState({})
  const [remaining, setRemaining] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showQuestionPanel, setShowQuestionPanel] = useState(false)
  const quizUserKey = useMemo(() => user?.email || user?._id || user?.id || 'guest', [user?.email, user?._id, user?.id])
  const quizStorageKey = useMemo(() => {
    return `mcq-draft-${quizUserKey}-${subject}-${chapterId}`
  }, [chapterId, quizUserKey, subject])

  useEffect(() => {
    let alive = true

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    const loadQuiz = async () => {
      setLoading(true)
      try {
        let response = null
        for (let attempt = 0; attempt < 3; attempt += 1) {
          response = await API.get(`/mcqs/${subject}/${chapterId}`)
          const loadedMcqs = response.data.mcqs || []
          if (loadedMcqs.length || attempt === 2) break
          await wait(700)
          if (!alive) return
        }

        if (!alive || !response) return
        const loadedMcqs = response.data.mcqs || []
        const defaultRemaining = loadedMcqs.length * 50
        let savedDraft = null
        try {
          savedDraft = JSON.parse(localStorage.getItem(quizStorageKey) || 'null')
        } catch {
          savedDraft = null
        }
        if (!savedDraft) {
          const suffix = `-${subject}-${chapterId}`
          const matchingDrafts = Object.keys(localStorage)
            .filter((key) => key.startsWith('mcq-draft-') && key.endsWith(suffix))
            .map((key) => {
              try {
                return { key, draft: JSON.parse(localStorage.getItem(key) || 'null') }
              } catch {
                return null
              }
            })
            .filter((item) => item?.draft)
            .sort((a, b) => new Date(b.draft.updatedAt || 0) - new Date(a.draft.updatedAt || 0))
          savedDraft = matchingDrafts[0]?.draft || null
        }
        const loadedIds = loadedMcqs.map((mcq) => String(mcq._id))
        const loadedIdSet = new Set(loadedIds)
        const savedIds = Array.isArray(savedDraft?.mcqIds) ? savedDraft.mcqIds.map(String) : []
        const savedAnswers = Object.fromEntries(
          Object.entries(savedDraft?.answers || {}).filter(([mcqId]) => loadedIdSet.has(String(mcqId))),
        )
        const savedSkipped = Object.fromEntries(
          Object.entries(savedDraft?.skipped || {}).filter(([mcqId]) => loadedIdSet.has(String(mcqId))),
        )
        const canRestore =
          savedDraft &&
          loadedIds.length > 0 &&
          (
            Object.keys(savedAnswers).length > 0 ||
            Object.values(savedSkipped).some(Boolean) ||
            (savedIds.length > 0 && savedIds.every((id) => loadedIdSet.has(id)))
          )

        setChapter(response.data.chapter)
        setMcqs(loadedMcqs)
        setCurrentIndex(canRestore ? Math.min(Number(savedDraft.currentIndex) || 0, loadedMcqs.length - 1) : 0)
        setAnswers(canRestore ? savedAnswers : {})
        setSkipped(canRestore ? savedSkipped : {})
        setRemaining(canRestore && Number(savedDraft.remaining) > 0 ? Number(savedDraft.remaining) : defaultRemaining)
      } catch (error) {
        if (alive) toast.error(error.response?.data?.error || 'Unable to load quiz')
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadQuiz()
    return () => { alive = false }
  }, [chapterId, quizStorageKey, subject])

  useEffect(() => {
    if (loading || !mcqs.length) return
    const draft = {
      mcqIds: mcqs.map((mcq) => mcq._id),
      currentIndex,
      answers,
      skipped,
      remaining,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(quizStorageKey, JSON.stringify(draft))
  }, [answers, currentIndex, loading, mcqs, quizStorageKey, remaining, skipped])

  const submit = async ({ force = false } = {}) => {
    if (submitting || !mcqs.length) return
    if (!force) {
      const unansweredCount = mcqs.filter((mcq) => answers[mcq._id] === undefined).length
      const skippedCount = mcqs.filter((mcq) => skipped[mcq._id]).length
      if (unansweredCount > 0 || skippedCount > 0) {
        toast.error(`Please attempt all MCQs before submitting. ${unansweredCount} unanswered, ${skippedCount} skipped.`)
        return
      }
    }
    setSubmitting(true)
    try {
      const res = await API.post(`/mcqs/${subject}/${chapterId}/submit`, {
        answers,
        timeLimitSeconds: mcqs.length * 50,
        timeSpentSeconds: mcqs.length * 50 - remaining,
      })
      const suffix = `-${subject}-${chapterId}`
      Object.keys(localStorage)
        .filter((key) => key.startsWith('mcq-draft-') && key.endsWith(suffix))
        .forEach((key) => localStorage.removeItem(key))
      sessionStorage.setItem(`mcq-result-${subject}-${chapterId}`, JSON.stringify(res.data))
      navigate(`/mcqs/${subject}/${chapterId}/result`, { state: { result: res.data } })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!mcqs.length || submitting) return undefined
    if (remaining <= 0) {
      submit({ force: true })
      return undefined
    }
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(timer)
  }, [remaining, mcqs.length, submitting]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = mcqs[currentIndex]
  const selected = current ? answers[current._id] : undefined
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')

  if (loading) {
    return (
      <div className="workspace-page animate-fade-up">
        <LoadingCard label="Preparing your quiz..." />
      </div>
    )
  }

  if (!current) {
    return <div className="workspace-page"><EmptyState title="No MCQs available" text="This chapter has no published MCQs yet." action={<Link className="btn btn-primary" to={`/mcqs/${subject}/${chapterId}`}>Back to MCQs</Link>} /></div>
  }

  const selectAnswer = (optionIndex) => {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [current._id]: optionIndex }))
    setSkipped((currentSkipped) => ({ ...currentSkipped, [current._id]: false }))
  }

  const skipQuestion = () => {
    setSkipped((currentSkipped) => ({ ...currentSkipped, [current._id]: true }))
    setAnswers((currentAnswers) => {
      const nextAnswers = { ...currentAnswers }
      delete nextAnswers[current._id]
      return nextAnswers
    })
    setCurrentIndex((index) => Math.min(mcqs.length - 1, index + 1))
  }

  const nextQuestion = () => {
    if (answers[current._id] === undefined) {
      setSkipped((currentSkipped) => ({ ...currentSkipped, [current._id]: true }))
    }
    setCurrentIndex((index) => Math.min(mcqs.length - 1, index + 1))
  }

  return (
    <div className="mcq-practice-page animate-fade-up">
      <section className="mcq-practice-shell">
        <div className="mcq-practice-top">
          <div>
            <div className="label-xs" style={{ color: meta?.accent }}>{meta?.name} &gt; {chapter?.name}</div>
            <h1>Quiz Attempt</h1>
            <p>Question {currentIndex + 1} of {mcqs.length}</p>
          </div>
          <div className="mcq-practice-tools">
            <button className="btn btn-secondary mcq-question-panel-toggle" type="button" onClick={() => setShowQuestionPanel(true)}>Questions</button>
            <div className="mcq-timer">{minutes}:{seconds}</div>
          </div>
        </div>

        <div className="mcq-attempt-layout">
          <div className="mcq-question-card">
            <h2>{current.question}</h2>
            <div className="mcq-options-grid">
              {current.options.map((option, index) => (
                <button key={`${current._id}-${index}`} className={`mcq-option-card ${selected === index ? 'mcq-option-card--selected' : ''}`} type="button" onClick={() => selectAnswer(index)}>
                  <span className="mcq-option-letter">{String.fromCharCode(65 + index)}</span>
                  <span>{option.text || option}</span>
                </button>
              ))}
            </div>
            <div className="mcq-nav-actions">
              <button className="btn btn-secondary" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)}>Previous</button>
              <button className="btn btn-ghost" type="button" onClick={skipQuestion}>Skip</button>
              <button className="btn btn-primary" type="button" disabled={currentIndex === mcqs.length - 1} onClick={nextQuestion}>Next</button>
              <button className="btn btn-danger" type="button" onClick={() => submit()} disabled={submitting}>Submit</button>
            </div>
          </div>

          {showQuestionPanel ? <button className="mcq-question-backdrop" type="button" aria-label="Close question list" onClick={() => setShowQuestionPanel(false)} /> : null}
          <aside className={`workspace-card mcq-question-sidebar ${showQuestionPanel ? 'mcq-question-sidebar--open' : ''}`}>
            <div className="workspace-card-head">
              <div><div className="label-xs">Jump</div><h3 className="workspace-card-title">Questions</h3></div>
              <button className="mcq-question-close" type="button" onClick={() => setShowQuestionPanel(false)} aria-label="Close question list">×</button>
            </div>
            <div className="workspace-card-body mcq-question-dots">
              {mcqs.map((mcq, index) => {
                const answered = answers[mcq._id] !== undefined
                const isSkipped = skipped[mcq._id]
                return <button key={mcq._id} className={`mcq-dot ${index === currentIndex ? 'mcq-dot--active' : ''} ${answered ? 'mcq-dot--answered' : ''} ${isSkipped ? 'mcq-dot--skipped' : ''}`} type="button" onClick={() => { setCurrentIndex(index); setShowQuestionPanel(false) }}>{index + 1}</button>
              })}
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

function QuizResult() {
  const { subject, chapterId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result || JSON.parse(sessionStorage.getItem(`mcq-result-${subject}-${chapterId}`) || 'null')

  if (!result) {
    return <div className="workspace-page"><EmptyState title="Result unavailable" text="Submit a quiz attempt first to view the result page." action={<Link className="btn btn-primary" to={`/mcqs/${subject}/${chapterId}`}>Back to MCQs</Link>} /></div>
  }

  const wrongItems = result.detailed.filter((item) => !item.skipped && !item.isCorrect)
  const skippedItems = result.detailed.filter((item) => item.skipped)

  return (
    <div className="mcq-review-page animate-fade-up">
      <section className="mcq-review-shell">
        <div className="mcq-review-top">
          <div>
            <div className="label-xs">{result.subject} &gt; {result.chapter?.name}</div>
            <h1>Quiz Result</h1>
            <p>{result.correct} correct · {result.wrong} wrong · {result.skipped} skipped</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => navigate(`/mcqs/${subject}/${chapterId}`)}>Back to MCQs</button>
        </div>
        <div className="review-stats-grid">
          <div className="review-stat-card review-stat-card--purple"><span>Total MCQs</span><strong>{result.totalQuestions}</strong></div>
          <div className="review-stat-card review-stat-card--green"><span>Correct</span><strong>{result.correct}</strong></div>
          <div className="review-stat-card review-stat-card--red"><span>Wrong</span><strong>{result.wrong}</strong></div>
          <div className="review-stat-card review-stat-card--purple"><span>Skipped</span><strong>{result.skipped}</strong></div>
          <div className="review-stat-card review-stat-card--green"><span>Score</span><strong>{result.score}/{result.totalQuestions}</strong></div>
          <div className="review-stat-card review-stat-card--purple"><span>Percentage</span><strong>{result.percentage}%</strong></div>
        </div>
        <ReviewSection title="Wrong Answers" items={wrongItems} />
        <ReviewSection title="Skipped Questions" items={skippedItems} />
      </section>
    </div>
  )
}

function ReviewSection({ title, items }) {
  return (
    <div className="review-question-stack">
      <h2>{title}</h2>
      {items.length === 0 ? <p className="text-muted">No items in this section.</p> : null}
      {items.map((item, index) => (
        <article key={String(item.mcqId)} className="review-question-card review-question-card--wrong">
          <div className="review-question-top"><span className="review-question-number">{title} {index + 1}</span></div>
          <h3>{item.question}</h3>
          <div className="review-options-list">
            {item.options.map((option, optionIndex) => {
              const correct = item.correctIndex === optionIndex
              const selected = item.selectedIndex === optionIndex
              return (
                <div key={`${item.mcqId}-${optionIndex}`} className={`review-option-row ${correct ? 'review-option-row--correct' : ''} ${selected && !correct ? 'review-option-row--wrong' : ''}`}>
                  <span className="review-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                  <span>{option.text || option}</span>
                  {selected ? <span className="review-option-tag">Your answer</span> : null}
                  {correct ? <span className="review-option-tag review-option-tag--correct">Correct answer</span> : null}
                </div>
              )
            })}
          </div>
          <div className="review-explanation-box"><strong>Explanation</strong><p>{item.explanation || 'No explanation added yet.'}</p></div>
        </article>
      ))}
    </div>
  )
}

export { CourseSelection, ChapterList, McqList, QuizAttempt, QuizResult }

export default CourseSelection

