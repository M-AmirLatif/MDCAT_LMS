import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import MCQRenderer from '../components/MCQRenderer'
import { normalizeImageUrl } from '../utils/mediaUrls'
import './PlatformPages.css'
import './MCQTest.css'
import './TestReview.css'

const SUBJECTS = [
  {
    id: 'biology',
    name: 'Biology',
    accent: '#1DB884',
    progress: 'linear-gradient(135deg,#1DB884,#2DD99B)',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    accent: '#6C47FF',
    progress: 'linear-gradient(135deg,#6C47FF,#1DB884)',
  },
  {
    id: 'physics',
    name: 'Physics',
    accent: '#4A90E2',
    progress: 'linear-gradient(135deg,#4A90E2,#6AABFF)',
  },
  {
    id: 'english',
    name: 'English',
    accent: '#F59E0B',
    progress: 'linear-gradient(135deg,#F59E0B,#FBB040)',
  },
]

const getAssignedSubjectNames = (user) => {
  if (user?.role !== 'teacher') return []
  const assigned = Array.isArray(user.assignedSubjects) && user.assignedSubjects.length
    ? user.assignedSubjects
    : user.assignedSubject
      ? [user.assignedSubject]
      : []
  return assigned.map((subject) => String(subject || '').trim()).filter(Boolean)
}

const emptyMcqForm = {
  question: '',
  questionImages: [],
  optionA: '',
  optionAImages: [],
  optionB: '',
  optionBImages: [],
  optionC: '',
  optionCImages: [],
  optionD: '',
  optionDImages: [],
  correctAnswer: 'A',
  explanation: '',
  explanationImages: [],
}

const letters = ['A', 'B', 'C', 'D']

const compactImageList = (...values) => values
  .flatMap((value) => {
    if (!value) return []
    return Array.isArray(value) ? value.filter(Boolean) : [value]
  })
  .filter((value) => Boolean(normalizeImageUrl(value)))

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


const getQuizResultStorageKey = (userKey, subject, chapterId) =>
  `mcq-result-${userKey}-${subject}-${chapterId}`

const getLegacyQuizResultStorageKey = (subject, chapterId) =>
  `mcq-result-${subject}-${chapterId}`

const readStoredQuizResult = (userKey, subject, chapterId) => {
  const key = getQuizResultStorageKey(userKey, subject, chapterId)
  try {
    return JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key) || 'null')
  } catch {
    // Ignore corrupt browser storage so a fresh quiz can start normally.
    return null
  }
}

const clearStoredQuizResult = (userKey, subject, chapterId) => {
  const keys = [
    getQuizResultStorageKey(userKey, subject, chapterId),
    getLegacyQuizResultStorageKey(subject, chapterId),
  ]
  keys.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
}

const getNumericMcqNumber = (mcq) => {
  const value = mcq?.originalQuestionNumber || mcq?.questionNumber || mcq?.csvRowIndex
  const raw = String(value ?? '').trim()
  const extracted = raw.match(/^\D*(\d+(?:\.\d+)?)\D*$/)?.[1] || raw
  const number = Number(extracted)
  return Number.isFinite(number) && number >= 1 ? number : null
}

const getMcqDisplayNumberOffset = (items = [], reviewItems = []) => {
  const numbers = items
    .map(getNumericMcqNumber)
    .filter((number) => number !== null)
  if (!numbers.length || numbers.some((number) => number === 1)) return 0
  const reviewNumbers = reviewItems
    .map(getNumericMcqNumber)
    .filter((number) => number !== null)
  if (reviewNumbers.includes(1)) return 0

  const numberedItems = items
    .map((mcq) => ({
      number: getNumericMcqNumber(mcq),
      csvRowIndex: Number(mcq?.csvRowIndex),
    }))
    .filter(
      (item) =>
        item.number !== null &&
        Number.isFinite(item.csvRowIndex) &&
        item.csvRowIndex > 0,
    )
  if (
    numberedItems.length >= 2 &&
    numberedItems.every((item) => item.number === item.csvRowIndex + 1)
  ) {
    return -1
  }

  const sortedNumbers = [...new Set(numbers)].sort((a, b) => a - b)
  const isHeaderShiftedSequence = sortedNumbers.every(
    (number, index) => number === index + 2,
  )
  return isHeaderShiftedSequence ? -1 : 0
}

const getMcqDisplayNumber = (mcq, fallbackIndex, offset = 0) => {
  const numeric = getNumericMcqNumber(mcq)
  if (numeric !== null) return String(Math.max(1, numeric + offset))
  return String(
    mcq?.originalQuestionNumber ||
      mcq?.questionNumber ||
      mcq?.csvRowIndex ||
      (Number.isFinite(fallbackIndex) ? fallbackIndex + 1 : ''),
  ).trim()
}

const getOptionImages = (mcq, letter, index) =>
  mcqOptionImages(mcq, mcq?.options?.[index], letter)

async function uploadMcqImage(file) {
  const data = new FormData()
  data.append('file', file)
  const res = await API.post('/uploads/single', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url || res.data.fileUrl || res.data.secure_url || res.data.secureUrl || res.data.absoluteUrl
}

function McqImagePreview({ image, label, index, onRemove }) {
  const src = normalizeImageUrl(image)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <div className="mcq-image-preview">
      {src && !failed ? (
        <img
          src={src}
          alt={`${label} ${index + 1}`}
          loading="eager"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="mcq-image-unavailable" role="status">Image unavailable</div>
      )}
      <button type="button" onClick={onRemove}>
        Remove
      </button>
    </div>
  )
}
function McqImageManager({ id, label, images = [], onChange }) {
  const [uploading, setUploading] = useState(false)
  const addImage = (nextUrl) => {
    const clean = String(nextUrl || '').trim()
    if (!clean) return
    onChange([...(images || []), clean])
  }

  const uploadFile = async (file, sourceLabel = label) => {
    if (!file) return
    if (!String(file.type || '').startsWith('image/')) {
      toast.error('Only image files can be uploaded here.')
      return
    }
    setUploading(true)
    try {
      const uploadedUrl = await uploadMcqImage(file)
      addImage(uploadedUrl)
      toast.success(`${sourceLabel} uploaded`)
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not upload this image.'))
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async (event) => {
    try {
      await uploadFile(event.target.files?.[0])
    } finally {
      event.target.value = ''
    }
  }

  const handlePaste = async (event) => {
    const items = Array.from(event.clipboardData?.items || [])
    const imageItem = items.find((item) => String(item.type || '').startsWith('image/'))
    const file = imageItem?.getAsFile()
    if (!file) return
    event.preventDefault()
    await uploadFile(file, `${label} pasted`)
  }

  const pasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      toast.error('Click this image field and press Ctrl+V to paste a copied image.')
      return
    }
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const clipboardItem of clipboardItems) {
        const imageType = clipboardItem.types.find((type) => type.startsWith('image/'))
        if (!imageType) continue
        const blob = await clipboardItem.getType(imageType)
        const extension = imageType.split('/')[1] || 'png'
        const file = new File([blob], `pasted-${Date.now()}.${extension}`, {
          type: imageType,
        })
        await uploadFile(file, `${label} pasted`)
        return
      }
      toast.error('No copied image found. Copy the image itself, then paste here.')
    } catch (error) {
      toast.error('Clipboard access was blocked. Click the image field and press Ctrl+V.')
    }
  }

  return (
    <div className="mcq-image-manager" onPaste={handlePaste}>
      <div className="mcq-image-manager-head">
        <span>{label}</span>
        <div className="mcq-image-manager-actions">
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={pasteFromClipboard}
            disabled={uploading}
          >
            Paste image
          </button>
          <label className="btn btn-secondary btn-sm" htmlFor={id}>
            {uploading ? 'Uploading...' : 'Upload image'}
          </label>
        </div>
        <input id={id} type="file" accept="image/*" onChange={handleUpload} hidden />
      </div>
      <div
        className="mcq-image-paste-zone"
        tabIndex={0}
        role="button"
        aria-label={`Paste copied image for ${label}`}
      >
        Click here and press Ctrl+V to paste a copied image, or upload a saved file.
      </div>
      {images?.length ? (
        <div className="mcq-image-preview-grid">
          {images.map((image, index) => (
            <McqImagePreview
              key={`${normalizeImageUrl(image) || index}-${index}`}
              image={image}
              label={label}
              index={index}
              onRemove={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function subjectById(id) {
  return SUBJECTS.find(
    (subject) => subject.id === String(id || '').toLowerCase(),
  )
}

function SubjectIcon({ subject }) {
  const paths = {
    Biology:
      'M12 4c-4 0-7 3.5-7 8 0 3.8 2.2 6.5 7 8 4.8-1.5 7-4.2 7-8 0-4.5-3-8-7-8Zm0 0v16M8 9c1.2 1.4 2.4 2.1 4 2.1 1.7 0 2.9-.7 4-2.1',
    Chemistry:
      'M10 3v6l-5.6 8.8A2 2 0 0 0 6.1 21h11.8a2 2 0 0 0 1.7-3.2L14 9V3M8.5 13h7',
    Physics:
      'M12 3v4M12 17v4M4 12H0m24 0h-4M5.6 5.6 2.8 2.8m18.4 18.4-2.8-2.8M18.4 5.6l2.8-2.8M5.6 18.4l-2.8 2.8M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
    English:
      'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16ZM9 7h6M9 11h6M9 15h4',
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={paths[subject]}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LoadingCard({ label = 'Loading...' }) {
  return (
    <div className="workspace-card">
      <div className="workspace-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div className="loading-spinner"></div>
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

function AutoSizeTextarea({
  value,
  onChange,
  className = '',
  minRows = 3,
  ...props
}) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      className={`${className} mcq-autosize-textarea`.trim()}
      value={value}
      onChange={onChange}
      rows={minRows}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      {...props}
    />
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="mcq-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="mcq-modal workspace-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">MCQ Bank</div>
            <h3 className="workspace-card-title">{title}</h3>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="workspace-card-body">{children}</div>
      </section>
    </div>
  )
}

function CourseSelection() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    API.get('/mcqs/subjects/summary')
      .then((res) => {
        if (alive) setSubjects(res.data.subjects || [])
      })
      .catch((error) =>
        toast.error(getUserFriendlyErrorMessage(error, 'We could not load the subjects right now.')),
      )
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const teacherSubjects = getAssignedSubjectNames(user)
  const visibleBaseSubjects =
    user?.role === 'teacher' && teacherSubjects.length
      ? SUBJECTS.filter((subject) => teacherSubjects.includes(subject.name))
      : SUBJECTS

  const merged = visibleBaseSubjects.map((subject) => ({
    ...subject,
    ...(subjects.find((item) => item.id === subject.id) || {}),
  }))

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card subject-browser-hero">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">MDCAT MCQ Bank</div>
            <h2 className="workspace-card-title">MCQ Practice Path</h2>
            <div className="mcq-learning-flow" aria-label="MCQ practice path">
              <span>Courses</span>
              <span>Chapters</span>
              <span>MCQs</span>
              <span>Quiz Attempt</span>
              <span>Result</span>
            </div>
            <p>
              Choose a subject, open its chapters, solve MCQs, and review your result.
            </p>
          </div>
        </div>
      </section>

      {loading ? <LoadingCard label="Loading subject bank..." /> : null}
      <div className="card-grid mcq-subject-grid">
        {merged.map((subject) => (
          <Link
            key={subject.id}
            className="workspace-card mcq-subject-card"
            to={`/mcqs/${subject.id}`}
            style={{ '--subject': subject.accent }}
          >
            <div className="mcq-subject-card-top">
              <span className="mcq-subject-icon">
                <SubjectIcon subject={subject.name} />
              </span>
              <div>
                <div className="label-xs" style={{ color: subject.accent }}>
                  {subject.name}
                </div>
                <h3 className="workspace-card-title">{subject.name}</h3>
              </div>
            </div>
            <div className="subject-stats-grid">
              <div>
                <span>Total Chapters</span>
                <strong>{subject.totalChapters || 0}</strong>
              </div>
              <div>
                <span>Total MCQs</span>
                <strong>{subject.totalMcqs || 0}</strong>
              </div>
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
    <form
      className="form-shell"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ name, description })
      }}
    >
      <div className="floating-field">
        <label htmlFor="chapter-name">Chapter Name</label>
        <input
          id="chapter-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Topic 1 - Cell Structure & Membrane"
        />
      </div>
      <div className="floating-field">
        <label htmlFor="chapter-description">Description</label>
        <textarea
          id="chapter-description"
          rows="4"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short chapter description for students."
        />
      </div>
      <button className="btn btn-primary" type="submit">
        Save Chapter
      </button>
    </form>
  )
}

function TopicForm({ initial, onSubmit }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')

  return (
    <form
      className="form-shell"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ name, description })
      }}
    >
      <div className="floating-field">
        <label htmlFor="topic-name">Topic Name</label>
        <input
          id="topic-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Membrane Transport"
        />
      </div>
      <div className="floating-field">
        <label htmlFor="topic-description">Description</label>
        <textarea
          id="topic-description"
          rows="4"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional topic description for teacher organization."
        />
      </div>
      <button className="btn btn-primary" type="submit">
        Save Topic
      </button>
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
      toast.error(getUserFriendlyErrorMessage(error, 'We could not load the chapters right now.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [subject]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!meta)
    return (
      <EmptyState
        title="Subject not found"
        text="Choose Biology, Chemistry, Physics, or English."
        action={
          <Link className="btn btn-primary" to="/mcqs">
            Back to Subjects
          </Link>
        }
      />
    )

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
      toast.error(getUserFriendlyErrorMessage(error, 'We could not save the chapter right now.'))
    }
  }

  const buildChapterMcqPath = (chapter) => {
    const params = new URLSearchParams()
    if (chapter.topicId) params.set('topicId', chapter.topicId)
    if (chapter.testPart) params.set('testPart', chapter.testPart)
    const query = params.toString()
    return `/mcqs/${subject}/${chapter.id}${query ? `?${query}` : ''}`
  }

  const deleteChapter = async (chapter) => {
    if (
      !window.confirm(
        `Delete "${chapter.name}"?\n\nThis will permanently delete the whole chapter, all topics inside it, all MCQs inside it, and related test records. This action cannot be undone.`,
      )
    )
      return
    try {
      const res = await API.delete(`/mcqs/${subject}/chapters/${chapter.id}`)
      const deletedMcqs = Number(res?.data?.deletedMcqs || 0)
      toast.success(
        deletedMcqs > 0
          ? `Chapter deleted with ${deletedMcqs} MCQ${deletedMcqs === 1 ? '' : 's'}`
          : 'Chapter deleted',
      )
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not delete the chapter right now.'))
    }
  }

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs" style={{ color: meta.accent }}>
              Subject &gt; Chapters
            </div>
            <h2 className="workspace-card-title">{meta.name} Chapters</h2>
            <p>
              Open a chapter to view MCQs. Teachers can add, rename, or delete
              chapters with confirmation before removal.
            </p>
          </div>
          <div className="inline-actions">
            <Link className="btn btn-secondary" to="/mcqs">
              Back to Subjects
            </Link>
            {isTeacher ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setModal({ type: 'chapter' })}
              >
                Add Chapter
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {loading ? <LoadingCard label="Loading chapters..." /> : null}
      <div className="chapter-browser-grid">
        {chapters.map((chapter) => (
          <article
            key={`${chapter.id}-${chapter.topicId || 'chapter'}-${chapter.testPart || 'base'}`}
            className={`workspace-card chapter-practice-card ${chapter.isLocked ? 'chapter-practice-card--locked' : ''}`}
          >
            <div className="workspace-card-head">
              <div>
                <div className="label-xs" style={{ color: meta.accent }}>
                  {meta.name}
                </div>
                <h3 className="workspace-card-title">{chapter.name}</h3>
                <p>
                  {chapter.description || 'Chapter based MCQ practice bank.'}
                </p>
              </div>
              <span className="state-chip state-chip--neutral">
                {chapter.mcqCount || 0} MCQs
              </span>
            </div>
            <div className="workspace-card-body">
              <div className="inline-actions">
                {chapter.isLocked && !isTeacher ? (
                  <Link className="btn btn-primary btn-sm" to="/payments">
                    Please subscribe to access this test/past paper.
                  </Link>
                ) : (
                  <Link
                    className="btn btn-primary btn-sm"
                    to={buildChapterMcqPath(chapter)}
                  >
                    Open MCQs
                  </Link>
                )}
                {isTeacher ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => setModal({ type: 'chapter', chapter })}
                  >
                    Edit
                  </button>
                ) : null}
                {isTeacher ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => deleteChapter(chapter)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!loading && chapters.length === 0 ? (
        <EmptyState
          title="No chapters added yet"
          text={`Teachers will add real ${meta.name} chapters before students can practice.`}
          action={
            isTeacher ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setModal({ type: 'chapter' })}
              >
                Add First Chapter
              </button>
            ) : (
              <Link className="btn btn-secondary" to="/mcqs">
                Back to Subjects
              </Link>
            )
          }
        />
      ) : null}
      {modal ? (
        <Modal
          title={modal.chapter ? 'Edit Chapter' : 'Add Chapter'}
          onClose={() => setModal(null)}
        >
          <ChapterForm key={modal.chapter?.id || 'new'} initial={modal.chapter} onSubmit={saveChapter} />
        </Modal>
      ) : null}
    </div>
  )
}

function mcqToForm(mcq) {
  if (!mcq) return { ...emptyMcqForm }
  if (Array.isArray(mcq.options) && mcq.options.length > 0) {
    const byLetter = ['A', 'B', 'C', 'D'].map((letter, index) => ({
      letter,
      text: mcq.options?.[index]?.text || '',
    }))
    return {
      question: mcq.question || '',
      questionImages: mcqQuestionImages(mcq),
      optionA: byLetter[0].text,
      optionAImages: getOptionImages(mcq, 'A', 0),
      optionB: byLetter[1].text,
      optionBImages: getOptionImages(mcq, 'B', 1),
      optionC: byLetter[2].text,
      optionCImages: getOptionImages(mcq, 'C', 2),
      optionD: byLetter[3].text,
      optionDImages: getOptionImages(mcq, 'D', 3),
      correctAnswer: mcq.correctAnswer || 'A',
      explanation: mcq.explanation || '',
      explanationImages: mcqExplanationImages(mcq),
    }
  }

  return {
    question: mcq.question || '',
    questionImages: mcqQuestionImages(mcq),
    optionA: mcq.optionA || '',
    optionAImages: mcqOptionImages(mcq, null, 'A'),
    optionB: mcq.optionB || '',
    optionBImages: mcqOptionImages(mcq, null, 'B'),
    optionC: mcq.optionC || '',
    optionCImages: mcqOptionImages(mcq, null, 'C'),
    optionD: mcq.optionD || '',
    optionDImages: mcqOptionImages(mcq, null, 'D'),
    correctAnswer: mcq.correctAnswer || 'A',
    explanation: mcq.explanation || '',
    explanationImages: mcqExplanationImages(mcq),
  }
}

function McqForm({ initial, onSubmit }) {
  const [form, setForm] = useState(initial ? mcqToForm(initial) : emptyMcqForm)
  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }))

  useEffect(() => {
    setForm(initial ? mcqToForm(initial) : emptyMcqForm)
  }, [initial])

  return (
    <form
      className="form-shell"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
    >
        <div className="floating-field">
          <label htmlFor="question">Question statement</label>
          <AutoSizeTextarea
            id="question"
            minRows={4}
            value={form.question}
            onChange={(event) => setField('question', event.target.value)}
            placeholder="Type the MDCAT question..."
          />
        </div>
        <McqImageManager
          id="question-image"
          label="Question image"
          images={form.questionImages || []}
          onChange={(images) => setField('questionImages', images)}
        />
      <div className="floating-grid">
        <div className="floating-field">
          <label htmlFor="option-a">Option A</label>
          <input
            id="option-a"
            value={form.optionA}
            onChange={(event) => setField('optionA', event.target.value)}
          />
        </div>
        <div className="floating-field">
          <label htmlFor="option-b">Option B</label>
          <input
            id="option-b"
            value={form.optionB}
            onChange={(event) => setField('optionB', event.target.value)}
          />
        </div>
        <div className="floating-field">
          <label htmlFor="option-c">Option C</label>
          <input
            id="option-c"
            value={form.optionC}
            onChange={(event) => setField('optionC', event.target.value)}
          />
        </div>
        <div className="floating-field">
          <label htmlFor="option-d">Option D</label>
          <input
            id="option-d"
            value={form.optionD}
            onChange={(event) => setField('optionD', event.target.value)}
          />
        </div>
      </div>
      <div className="floating-grid">
        {letters.map((letter) => (
          <McqImageManager
            key={`option-image-${letter}`}
            id={`option-${letter.toLowerCase()}-image`}
            label={`Option ${letter} image`}
            images={form[`option${letter}Images`] || []}
            onChange={(images) => setField(`option${letter}Images`, images)}
          />
        ))}
      </div>
      <div className="floating-field">
        <label htmlFor="correct-answer">Correct Answer</label>
        <select
          id="correct-answer"
          value={form.correctAnswer}
          onChange={(event) => setField('correctAnswer', event.target.value)}
        >
          <option value="A">Option A</option>
          <option value="B">Option B</option>
          <option value="C">Option C</option>
          <option value="D">Option D</option>
        </select>
      </div>
      <div className="floating-field">
        <label htmlFor="explanation">Explanation / Description</label>
        <textarea
          id="explanation"
          rows="5"
          value={form.explanation}
          onChange={(event) => setField('explanation', event.target.value)}
          placeholder="Explanation students see after submission."
        />
      </div>
      <McqImageManager
        id="explanation-image"
        label="Explanation image"
        images={form.explanationImages || []}
        onChange={(images) => setField('explanationImages', images)}
      />
      <button className="btn btn-primary" type="submit">
        Save MCQ
      </button>
    </form>
  )
}

function ReviewQueueForm({ initial, onSubmit }) {
  const [form, setForm] = useState(initial ? mcqToForm(initial) : emptyMcqForm)
  const [reason, setReason] = useState(initial?.reason || '')
  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }))

  useEffect(() => {
    setForm(initial ? mcqToForm(initial) : emptyMcqForm)
    setReason(initial?.reason || '')
  }, [initial])

  return (
    <form
      className="form-shell"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ ...form, reason })
      }}
    >
        <div className="floating-field">
          <label htmlFor="review-reason">Review Note</label>
          <AutoSizeTextarea
            id="review-reason"
            minRows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why this CSV row needs review."
          />
        </div>
        <div className="floating-field">
          <label htmlFor="review-question">Question statement</label>
          <AutoSizeTextarea
            id="review-question"
            minRows={4}
            value={form.question}
            onChange={(event) => setField('question', event.target.value)}
          />
        </div>
      <div className="floating-grid">
        {['A', 'B', 'C', 'D'].map((letter) => (
          <div className="floating-field" key={letter}>
            <label htmlFor={`review-option-${letter.toLowerCase()}`}>
              {`Option ${letter}`}
            </label>
            <input
              id={`review-option-${letter.toLowerCase()}`}
              value={form[`option${letter}`]}
              onChange={(event) =>
                setField(`option${letter}`, event.target.value)
              }
            />
          </div>
        ))}
      </div>
      <div className="floating-field">
        <label htmlFor="review-correct-answer">Correct Answer</label>
        <select
          id="review-correct-answer"
          value={form.correctAnswer}
          onChange={(event) => setField('correctAnswer', event.target.value)}
        >
          <option value="A">Option A</option>
          <option value="B">Option B</option>
          <option value="C">Option C</option>
          <option value="D">Option D</option>
        </select>
      </div>
        <div className="floating-field">
          <label htmlFor="review-explanation">Explanation / Description</label>
          <AutoSizeTextarea
            id="review-explanation"
            minRows={5}
            value={form.explanation}
            onChange={(event) => setField('explanation', event.target.value)}
          />
        </div>
      <button className="btn btn-primary" type="submit">
        Save Review Item
      </button>
    </form>
  )
}

function TeacherInlineMcqCard({ mcq, index, displayNumberOffset = 0, chapterId, meta, onSaved, onDelete }) {
  const [form, setForm] = useState(() => mcqToForm(mcq))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setForm(mcqToForm(mcq))
  }, [mcq])

  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }))

  const handleReset = () => {
    if (window.confirm("Reset this question's changes to the last saved state?")) {
      setForm(mcqToForm(mcq))
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const options = letters.map((letter) => ({
        text: form[`option${letter}`],
        images: form[`option${letter}Images`] || [],
        isCorrect: form.correctAnswer === letter,
      }))
      await API.put(`/mcqs/${mcq._id}`, {
        question: form.question,
        questionText: form.question,
        questionImages: form.questionImages || [],
        options,
        explanation: form.explanation,
        explanationText: form.explanation,
        explanationImages: form.explanationImages || [],
        correctAnswer: form.correctAnswer,
        topic: mcq.topic || 'General',
        chapterName: mcq.chapterName,
        chapterId,
        topicId: mcq.topicId || null,
        subject: meta?.name,
        isPublished: true,
      })
      toast.success(`Question ${getMcqDisplayNumber(mcq, index, displayNumberOffset)} saved successfully`)
      onSaved()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not save the MCQ.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLocal = async () => {
    await onDelete(mcq)
  }

  return (
    <article className="workspace-card mcq-inline-card mcq-managed-parent-card animate-fade-up">
      <div className="mcq-inline-card-header">
        <span className="mcq-inline-card-number">QUESTION {getMcqDisplayNumber(mcq, index, displayNumberOffset)}</span>
        {saving && <span className="mcq-inline-card-status">Saving...</span>}
      </div>

      <form onSubmit={handleSave} className="mcq-inline-card-form">
        <div className="mcq-section-container">
          <label className="mcq-section-label" htmlFor={`question-${mcq._id}`}>
            QUESTION STATEMENT
          </label>
          <AutoSizeTextarea
            id={`question-${mcq._id}`}
            className="mcq-inline-statement-textarea"
            minRows={3}
            value={form.question}
            onChange={(event) => setField('question', event.target.value)}
            placeholder="Type question statement here..."
          />
          <McqImageManager
            id={`question-image-${mcq._id}`}
            label="Question image"
            images={form.questionImages || []}
            onChange={(images) => setField('questionImages', images)}
          />
        </div>

        <div className="mcq-options-section">
          <span className="mcq-section-label">OPTIONS</span>
          <div className="mcq-inline-options-list">
            {['A', 'B', 'C', 'D'].map((letter) => {
              const isCorrect = form.correctAnswer === letter
              return (
                <div
                  className={`mcq-inline-option-row ${
                    isCorrect ? 'mcq-inline-option-row--correct' : ''
                  }`}
                  key={letter}
                >
                  <span className="mcq-option-badge">{letter}</span>
                  <input
                    id={`option-${letter.toLowerCase()}-${mcq._id}`}
                    className="mcq-inline-option-input"
                    value={form[`option${letter}`]}
                    onChange={(event) => setField(`option${letter}`, event.target.value)}
                    placeholder={`Type Option ${letter}...`}
                    aria-label={`Option ${letter}`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="mcq-inline-meta-grid">
          <div className="mcq-meta-box mcq-correct-box">
            <label className="mcq-section-label" htmlFor={`correct-answer-${mcq._id}`}>
              CORRECT OPTION
            </label>
            <div className="mcq-correct-select-wrapper">
              <select
                id={`correct-answer-${mcq._id}`}
                className="mcq-inline-select"
                value={form.correctAnswer}
                onChange={(event) => setField('correctAnswer', event.target.value)}
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
          </div>

          <div className="mcq-meta-box mcq-explanation-box">
            <label className="mcq-section-label" htmlFor={`explanation-${mcq._id}`}>
              EXPLANATION
            </label>
            <AutoSizeTextarea
              id={`explanation-${mcq._id}`}
              className="mcq-inline-explanation-textarea"
              minRows={2}
              value={form.explanation}
              onChange={(event) => setField('explanation', event.target.value)}
              placeholder="Provide correct explanation..."
            />
            <McqImageManager
              id={`explanation-image-${mcq._id}`}
              label="Explanation image"
              images={form.explanationImages || []}
              onChange={(images) => setField('explanationImages', images)}
            />
          </div>
        </div>

        <div className="mcq-inline-card-actions">
          <button
            type="submit"
            className="btn btn-mcq-save"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn-mcq-reset"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-mcq-delete"
            onClick={handleDeleteLocal}
            disabled={deleting || saving}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </form>
    </article>
  )
}

function ReviewQueueReadonlyCard({ item, index, onEdit, onApprove, onDelete }) {
  const correctAnswerLetter =
    String(item.correctAnswer || '')
      .trim()
      .toUpperCase()
      .match(/[A-D]/)?.[0] || ''

  return (
    <article className="teacher-mcq-row teacher-mcq-row--editor mcq-review-parent-card">
      <div className="teacher-mcq-editor-head">
        <span className="state-chip state-chip--neutral">
          MCQ {item.originalQuestionNumber || item.questionNumber || item.row || index + 1}
        </span>
        <span className="state-chip state-chip--neutral">
          CSV row {item.csvRowIndex || item.row || index + 1}
        </span>
      </div>
      {item.validationErrors?.length ? (
        <div className="review-validation-list">
          {item.validationErrors.map((error) => (
            <span className="state-chip state-chip--warning" key={error}>
              {error}
            </span>
          ))}
        </div>
      ) : null}
      <div className="floating-field teacher-mcq-question-field">
        <label>Issue</label>
        <AutoSizeTextarea
          minRows={2}
          value={item.reason || 'Rejected CSV row'}
          readOnly
          onChange={() => {}}
        />
      </div>
      <div className="teacher-review-render-block">
        <div className="teacher-review-render-card">
          <div className="teacher-review-render-label">Question</div>
          <div className="teacher-review-render-content">
            <MCQRenderer text={item.questionText || item.question || ''} images={mcqQuestionImages(item)} />
          </div>
        </div>
      </div>
      <div className="teacher-mcq-option-grid">
        {letters.map((letter, index) => {
          const isCorrect = correctAnswerLetter === letter
          return (
            <div
              className={`teacher-mcq-option-field ${isCorrect ? 'teacher-mcq-option-field--correct' : ''}`}
              key={letter}
            >
              <label>{`Option ${letter}`}</label>
              <div className="teacher-review-render-content">
                <MCQRenderer text={item[`option${letter}`] || item.options?.[index]?.text || ''} images={mcqOptionImages(item, item.options?.[index], letter)} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="teacher-mcq-editor-bottom">
        <div className="floating-field">
          <label>Correct Answer</label>
          <AutoSizeTextarea
            minRows={2}
            value={item.correctAnswer || ''}
            readOnly
            onChange={() => {}}
          />
        </div>
        <div className="floating-field">
          <label>Explanation</label>
          <div className="teacher-review-render-content">
            <MCQRenderer text={item.explanationText || item.explanation || ''} images={mcqExplanationImages(item)} />
          </div>
        </div>
      </div>
      <div className="teacher-mcq-action-row review-queue-action-row">
        <button
          className="btn btn-primary btn-sm btn-mcq-edit"
          type="button"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={onApprove}
        >
          Push To Main MCQs
        </button>
        <button
          className="btn btn-danger btn-sm btn-mcq-delete"
          type="button"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </article>
  )
}

function McqList() {
  const { subject, chapterId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isTeacher } = useAuth()
  const meta = subjectById(subject)
  const [lockMessage, setLockMessage] = useState('')
  const [chapter, setChapter] = useState(null)
  const [topics, setTopics] = useState([])
  const [mcqs, setMcqs] = useState([])
  const [reviewQueue, setReviewQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selectedTopicId, setSelectedTopicId] = useState(searchParams.get('topicId') || '')
  const initialViewMode = searchParams.get('view') === 'review' ? 'review' : 'mcqs'
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [activeHeaderAction, setActiveHeaderAction] = useState(initialViewMode)
  const fileRef = useRef(null)
  const testPart = searchParams.get('testPart')
  const topicIdParam = searchParams.get('topicId')
  const studentMcqQuery = useMemo(() => {
    const params = new URLSearchParams()
    const activeTopicId = selectedTopicId || topicIdParam
    if (activeTopicId) params.set('topicId', activeTopicId)
    if (testPart) params.set('testPart', testPart)
    const query = params.toString()
    return query ? `?${query}` : ''
  }, [selectedTopicId, testPart, topicIdParam])

  const selectedTopic =
    topics.find((topic) => topic.id === selectedTopicId) || null
  const mcqDisplayNumberOffset = useMemo(
    () => getMcqDisplayNumberOffset(mcqs, reviewQueue),
    [mcqs, reviewQueue],
  )

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedTopicId) params.set('topicId', selectedTopicId)
      if (!isTeacher && testPart) params.set('testPart', testPart)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await API.get(`/mcqs/${subject}/${chapterId}${query}`)
      setLockMessage('')
      setChapter(res.data.chapter)
      setTopics(res.data.topics || [])
      setMcqs(res.data.mcqs || [])
      setReviewQueue(res.data.reviewQueue || [])
    } catch (error) {
      if (error?.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        setLockMessage(error.response.data.error)
        return
      }
      toast.error(getUserFriendlyErrorMessage(error, 'We could not load the MCQs right now.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [subject, chapterId, selectedTopicId, testPart]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isTeacher) return
    const nextMode = searchParams.get('view') === 'review' ? 'review' : 'mcqs'
    setViewMode(nextMode)
    setActiveHeaderAction(nextMode)
  }, [isTeacher, searchParams])

  const updateViewMode = (nextMode) => {
    setViewMode(nextMode)
    setActiveHeaderAction(nextMode)
    if (!isTeacher) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('view', nextMode)
    setSearchParams(nextParams, { replace: true })
  }

  const saveTopic = async (payload) => {
    try {
      if (modal?.topic) {
        await API.put(
          `/mcqs/${subject}/chapters/${chapterId}/topics/${modal.topic.id}`,
          payload,
        )
        toast.success('Topic updated')
      } else {
        await API.post(`/mcqs/${subject}/chapters/${chapterId}/topics`, payload)
        toast.success('Topic added')
      }
      setModal(null)
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not save the topic right now.'))
    }
  }

  const deleteTopic = async (topic) => {
    if (
      !window.confirm(
        `Delete topic "${topic.name}"? This only works when the topic has no MCQs.`,
      )
    )
      return
    try {
      await API.delete(
        `/mcqs/${subject}/chapters/${chapterId}/topics/${topic.id}`,
      )
      if (selectedTopicId === topic.id) setSelectedTopicId('')
      toast.success('Topic deleted')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not delete the topic right now.'))
    }
  }

  const saveMcq = async (payload) => {
    try {
      if (modal?.mcq) {
        const options = letters.map((letter) => ({
          text: payload[`option${letter}`],
          images: payload[`option${letter}Images`] || [],
          isCorrect: payload.correctAnswer === letter,
        }))
        await API.put(`/mcqs/${modal.mcq._id}`, {
          question: payload.question,
          questionText: payload.question,
          questionImages: payload.questionImages || [],
          options,
          explanation: payload.explanation,
          explanationText: payload.explanation,
          explanationImages: payload.explanationImages || [],
          correctAnswer: payload.correctAnswer,
          topic: modal.mcq.topic || chapter?.name,
          chapterName: chapter?.name,
          chapterId,
          topicId: modal.mcq.topicId || null,
          subject: meta?.name,
          isPublished: true,
        })
        toast.success('MCQ updated')
      } else {
        await API.post(`/mcqs/${subject}/${chapterId}`, {
          ...payload,
          questionText: payload.question,
          explanationText: payload.explanation,
          topicId: selectedTopicId || null,
        })
        if (modal?.reviewItem?.id) {
          await API.delete(
            `/mcqs/${subject}/chapters/${chapterId}/review-queue/${modal.reviewItem.id}`,
          )
        }
        toast.success('MCQ added')
      }
      setModal(null)
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not save the MCQ right now.'))
    }
  }

  const saveReviewItem = async (payload) => {
    try {
      await API.put(
        `/mcqs/${subject}/chapters/${chapterId}/review-queue/${modal.reviewItem.id}`,
        payload,
      )
      toast.success('Review item updated')
      setModal(null)
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not update the review item right now.'))
    }
  }

  const deleteMcq = async (mcq) => {
    if (!window.confirm('Delete this MCQ?')) return
    try {
      await API.delete(`/mcqs/${mcq._id}`)
      toast.success('MCQ deleted')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not delete the MCQ right now.'))
    }
  }

  const uploadCsv = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const csvText = await file.text()
      const res = await API.post(`/mcqs/${subject}/${chapterId}/upload-csv`, {
        csvText,
        fileName: file.name,
        topicId: selectedTopicId || null,
      })
      toast.success(
        `Total rows: ${res.data.totalRows ?? 'N/A'} | Imported: ${res.data.importedRows ?? res.data.imported} | Needs review: ${res.data.reviewRows ?? res.data.queuedForReview}`,
      )
      if (res.data.reviewQuestionNumbers?.length) {
        toast(
          `Review question numbers: ${res.data.reviewQuestionNumbers.join(', ')}`,
          { duration: 8000 },
        )
      }
      if (res.data.queuedForReview) {
        toast(
          `${res.data.queuedForReview} rejected row${res.data.queuedForReview === 1 ? '' : 's'} saved in this chapter's review queue.`,
          { duration: 7000 },
        )
      }
      if (res.data.skipped?.length) {
        toast.error(
          res.data.skipped
            .map((row) => `Question ${row.questionNumber || row.originalQuestionNumber || row.row} / CSV row ${row.csvRowIndex || row.row}: ${row.reason}`)
            .join('\n'),
          { duration: 8000 },
        )
      }
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not upload the CSV right now.'))
    } finally {
      event.target.value = ''
    }
  }

  const removeReviewItem = async (item) => {
    if (!window.confirm('Remove this rejected CSV row from the review queue?'))
      return
    try {
      await API.delete(
        `/mcqs/${subject}/chapters/${chapterId}/review-queue/${item.id}`,
      )
      toast.success('Review item removed')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not remove the review item right now.'))
    }
  }

  const pushReviewItemToMain = async (item) => {
    if (
      !window.confirm(
        'Push this reviewed item into the main MCQ list now?',
      )
    )
      return
    try {
      await API.post(
        `/mcqs/${subject}/chapters/${chapterId}/review-queue/${item.id}/approve`,
        {
          question: item.question,
          optionA: item.optionA,
          optionB: item.optionB,
          optionC: item.optionC,
          optionD: item.optionD,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
        },
      )
      toast.success('Review item pushed to main MCQs')
      updateViewMode('review')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not push the review item right now.'))
    }
  }

  if (!meta)
    return (
      <EmptyState
        title="Subject not found"
        text="Choose Biology, Chemistry, Physics, or English."
        action={
          <Link className="btn btn-primary" to="/mcqs">
            Back to Subjects
          </Link>
        }
      />
    )

  if (lockMessage) {
    return (
      <div className="workspace-page animate-fade-up">
        <EmptyState
          title="Subscription required"
          text={lockMessage}
          action={
            <Link className="btn btn-primary" to="/payments">
              Subscribe
            </Link>
          }
        />
      </div>
    )
  }
  const totalSeconds = mcqs.length * 50
  const formattedTime = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`

  return (
    <div className="workspace-page workspace-page--mcq-list animate-fade-up">
      <section className="workspace-card workspace-header-sticky">
        <div className="workspace-card-head workspace-card-head--aligned">
          <div className="workspace-card-head-left">
            <div className="label-xs" style={{ color: meta.accent }}>
              {meta.name} MCQ BANK
            </div>
            <div className="workspace-title-date-row">
              <h2 className="workspace-card-title">
                {chapter?.name || `${meta.name} MCQ Workspace`}
              </h2>
              <span className="workspace-header-date">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <p className="workspace-card-subtitle">
              {isTeacher
                ? 'Manage and edit course questions, correct answers, and explanations directly on this page.'
                : 'Start a quiz when MCQs are available.'}
            </p>
          </div>
          <div className="inline-actions">
            <Link className="btn btn-secondary" to={`/mcqs/${subject}`}>
              Back to Chapters
            </Link>
            {isTeacher ? (
              <button
                className={`btn ${activeHeaderAction === 'mcqs' ? 'btn-primary' : 'btn-secondary'}`}
                type="button"
                onClick={() => updateViewMode('mcqs')}
              >
                MCQs Test
              </button>
            ) : null}
            {isTeacher ? (
              <button
                className={`btn ${activeHeaderAction === 'review' ? 'btn-primary' : 'btn-secondary'}`}
                type="button"
                onClick={() => updateViewMode('review')}
              >
                {`Review Queue${reviewQueue.length ? ` (${reviewQueue.length})` : ''}`}
              </button>
            ) : null}
            {isTeacher ? (
              <button
                className={`btn ${activeHeaderAction === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                type="button"
                onClick={() => {
                  setActiveHeaderAction('add')
                  setModal({ type: 'mcq' })
                }}
              >
                Add MCQ
              </button>
            ) : null}
            {isTeacher ? (
              <button
                className={`btn ${activeHeaderAction === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                type="button"
                onClick={() => {
                  setActiveHeaderAction('upload')
                  fileRef.current?.click()
                }}
              >
                Upload CSV
              </button>
            ) : null}
            {!isTeacher ? (
              <Link
                className="btn btn-primary"
                to={`/mcqs/${subject}/${chapterId}/attempt${!isTeacher ? studentMcqQuery : ''}`}
              >
                Start Quiz
              </Link>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              setActiveHeaderAction('upload')
              uploadCsv(event)
            }}
          />
        </div>
      </section>

      {loading ? <LoadingCard label="Loading MCQs..." /> : null}

      {isTeacher && viewMode === 'review' ? (
        <section className="workspace-card review-queue-card">
          <div className="workspace-card-head review-queue-head">
            <div>
              <div className="label-xs">CSV Review Queue</div>
              <h3 className="workspace-card-title">
                Rejected CSV Rows
              </h3>
              <p>
                These rows were not added as MCQs. Review them here, then add
                them manually after correcting the data.
              </p>
            </div>
            <span className="state-chip state-chip--neutral">
              {reviewQueue.length} pending
            </span>
          </div>
          <div className="workspace-card-body">
            {reviewQueue.length > 0 ? (
              <div className="teacher-mcq-list teacher-mcq-list--editable">
                {reviewQueue.map((item, index) => (
                  <ReviewQueueReadonlyCard
                    key={item.id}
                    item={item}
                    index={index}
                    onEdit={() => setModal({ type: 'review', reviewItem: item })}
                    onApprove={() => pushReviewItemToMain(item)}
                    onDelete={() => removeReviewItem(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No rejected CSV rows"
                text="When CSV rows fail validation, they will appear here for teacher review."
                action={
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => updateViewMode('mcqs')}
                  >
                    Back To Main MCQs
                  </button>
                }
              />
            )}
          </div>
        </section>
      ) : null}

      {viewMode !== 'review' ? (
        isTeacher ? (
          mcqs.length > 0 ? (
            <div className="mcq-inline-list">
              {mcqs.map((mcq, index) => (
                <TeacherInlineMcqCard
                  key={mcq._id}
                  mcq={mcq}
                  index={index}
                  displayNumberOffset={mcqDisplayNumberOffset}
                  chapterId={chapterId}
                  meta={meta}
                  onSaved={load}
                  onDelete={deleteMcq}
                />
              ))}
            </div>
          ) : (
            <div className="workspace-card">
              <div className="workspace-card-body">
                <EmptyState
                  title="No MCQs in this chapter yet"
                  text="Teachers will add real questions with correct answers and explanations."
                  action={
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => setModal({ type: 'mcq' })}
                    >
                      Add First MCQ
                    </button>
                  }
                />
              </div>
            </div>
          )
        ) : (
          <div className="workspace-card">
            <div className="workspace-card-body">
              <div className="student-quiz-summary-grid">
                <div className="student-quiz-summary-card">
                  <span className="student-quiz-summary-icon">?</span>
                  <div>
                    <small>Total MCQs</small>
                    <strong>{mcqs.length}</strong>
                  </div>
                </div>
                <div className="student-quiz-summary-card">
                  <span className="student-quiz-summary-icon student-quiz-summary-icon--timer">
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="13"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M9 2h6M12 7v6l4 2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <small>Quiz Time</small>
                    <strong>{formattedTime}</strong>
                  </div>
                </div>
                <div className="student-quiz-summary-card">
                  <span className="student-quiz-summary-icon">50s</span>
                  <div>
                    <small>Per MCQ</small>
                    <strong>50 sec</strong>
                  </div>
                </div>
              </div>
              {mcqs.length > 0 ? (
                <div className="student-quiz-motivation">
                  <div className="student-quiz-motivation-copy">
                    <span className="student-quiz-motivation-kicker">
                      Practice mindset
                    </span>
                    <h3>
                      One focused attempt can expose your weak spots before the
                      exam does.
                    </h3>
                    <p>
                      Answer calmly, skip what blocks you, then review every
                      explanation. Chapter practice improves accuracy faster
                      than random revision.
                    </p>
                  </div>
                  <div
                    className="student-quiz-motivation-steps"
                    aria-label="Practice approach"
                  >
                    <span>
                      <b>1</b> Attempt every MCQ
                    </span>
                    <span>
                      <b>2</b> Mark difficult questions
                    </span>
                    <span>
                      <b>3</b> Review explanations
                    </span>
                  </div>
                  <Link
                    className="btn btn-primary"
                    to={`/mcqs/${subject}/${chapterId}/attempt${!isTeacher ? studentMcqQuery : ''}`}
                  >
                    Start focused practice
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        )
      ) : null}
      {modal ? (
        <Modal
          title={
            modal.type === 'topic'
              ? modal.topic
                ? 'Edit Topic'
                : 'Add Topic'
              : modal.type === 'review'
                ? 'Edit Review Item'
              : modal.mcq
                ? 'Edit MCQ'
                : modal.reviewItem
                  ? 'Add Review Queue MCQ'
                : 'Add MCQ'
          }
          onClose={() => setModal(null)}
        >
          {modal.type === 'topic' ? (
            <TopicForm key={modal.topic?.id || 'new'} initial={modal.topic} onSubmit={saveTopic} />
          ) : modal.type === 'review' ? (
            <ReviewQueueForm
              key={modal.reviewItem?.id || 'new'}
              initial={modal.reviewItem}
              onSubmit={saveReviewItem}
            />
          ) : (
            <McqForm
              key={modal.mcq?._id || modal.reviewItem?.id || 'new'}
              initial={modal.mcq || modal.reviewItem}
              onSubmit={saveMcq}
            />
          )}
        </Modal>
      ) : null}
    </div>
  )
}

function QuizAttempt() {
  const { subject, chapterId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const meta = subjectById(subject)
  const testPart = searchParams.get('testPart')
  const topicIdParam = searchParams.get('topicId')
  const chapterAttemptId = [
    chapterId,
    topicIdParam ? `topic-${topicIdParam}` : null,
    testPart ? `part-${testPart}` : null,
  ]
    .filter(Boolean)
    .join('-')
  const testPartQuery = (() => {
    const params = new URLSearchParams()
    if (topicIdParam) params.set('topicId', topicIdParam)
    if (testPart) params.set('testPart', testPart)
    const query = params.toString()
    return query ? `?${query}` : ''
  })()
  const [chapter, setChapter] = useState(null)
  const [mcqs, setMcqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [skipped, setSkipped] = useState({})
  const [remaining, setRemaining] = useState(0)
  const [quizTiming, setQuizTiming] = useState({
    startedAt: null,
    expiresAt: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [showQuestionPanel, setShowQuestionPanel] = useState(false)
  const currentIndexRef = useRef(0)
  const quizUserKey = useMemo(
    () => user?.email || user?._id || user?.id || 'guest',
    [user?.email, user?._id, user?.id],
  )
  const quizStorageKey = useMemo(() => {
    return `mcq-draft-${quizUserKey}-${subject}-${chapterAttemptId}`
  }, [chapterAttemptId, quizUserKey, subject])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])
  useEffect(() => {
    let alive = true

    const loadQuiz = async () => {
      setLoading(true)
      try {
        let activeDraft = null
        try {
          activeDraft = JSON.parse(localStorage.getItem(quizStorageKey) || 'null')
        } catch {
          activeDraft = null
        }

        if (location.state?.retake) {
          clearStoredQuizResult(quizUserKey, subject, chapterAttemptId)
        } else if (!activeDraft) {
          const storedResult = readStoredQuizResult(quizUserKey, subject, chapterAttemptId)
          if (storedResult) {
            navigate(`/mcqs/${subject}/${chapterId}/result${testPartQuery}`, {
              replace: true,
              state: { result: storedResult },
            })
            return
          }
        }
        if (!location.state?.retake && !activeDraft) {
          const previousAttempt = await API.get(`/mcqs/${subject}/${chapterId}/latest-attempt${testPartQuery}`)
          if (!alive) return
          if (previousAttempt.data.result) {
            const resultPayload = JSON.stringify(previousAttempt.data.result)
            const resultKey = getQuizResultStorageKey(quizUserKey, subject, chapterAttemptId)
            localStorage.setItem(resultKey, resultPayload)
            sessionStorage.setItem(resultKey, resultPayload)
            navigate(`/mcqs/${subject}/${chapterId}/result${testPartQuery}`, {
              replace: true,
              state: { result: previousAttempt.data.result },
            })
            return
          }
        }
        const response = await API.get(`/mcqs/${subject}/${chapterId}${testPartQuery}`)

        if (!alive || !response) return
        const loadedMcqs = response.data.mcqs || []
        const defaultRemaining = loadedMcqs.length * 50
        // Never search another account's drafts. The exact user-scoped key is the only resumable source.
        let savedDraft = activeDraft
        if (savedDraft?.ownerKey && savedDraft.ownerKey !== quizUserKey) {
          savedDraft = null
        }
        const loadedIds = loadedMcqs.map((mcq) => String(mcq._id))
        const loadedIdSet = new Set(loadedIds)
        const savedIds = Array.isArray(savedDraft?.mcqIds)
          ? savedDraft.mcqIds.map(String)
          : []
        const savedAnswers = Object.fromEntries(
          Object.entries(savedDraft?.answers || {}).filter(([mcqId]) =>
            loadedIdSet.has(String(mcqId)),
          ),
        )
        const savedSkipped = Object.fromEntries(
          Object.entries(savedDraft?.skipped || {}).filter(([mcqId]) =>
            loadedIdSet.has(String(mcqId)),
          ),
        )
        const canRestore =
          savedDraft &&
          loadedIds.length > 0 &&
          (Object.keys(savedAnswers).length > 0 ||
            Object.values(savedSkipped).some(Boolean) ||
            (savedIds.length > 0 &&
              savedIds.every((id) => loadedIdSet.has(id))))
        const now = Date.now()
        const savedRemaining = Number(savedDraft?.remaining)
        const remainingFromDraft = canRestore && Number.isFinite(savedRemaining)
          ? Math.max(0, Math.min(defaultRemaining, Math.ceil(savedRemaining)))
          : defaultRemaining
        const startedAt = now
        const expiresAt = now + remainingFromDraft * 1000
        const remainingFromClock = remainingFromDraft

        setChapter(response.data.chapter)
        setMcqs(loadedMcqs)
        setCurrentIndex(
          canRestore
            ? Math.min(
                Number(savedDraft.currentIndex) || 0,
                loadedMcqs.length - 1,
              )
            : 0,
        )
        setAnswers(canRestore ? savedAnswers : {})
        setSkipped(canRestore ? savedSkipped : {})
        setQuizTiming({ startedAt, expiresAt })
        setRemaining(remainingFromClock)
      } catch (error) {
        if (alive)
          toast.error(getUserFriendlyErrorMessage(error, 'We could not load the quiz right now.'))
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadQuiz()
    return () => {
      alive = false
    }
  }, [chapterAttemptId, chapterId, location.state?.retake, navigate, quizStorageKey, quizUserKey, subject, testPartQuery])

  useEffect(() => {
    if (loading || !mcqs.length) return
    const draft = {
      ownerKey: quizUserKey,
      mcqIds: mcqs.map((mcq) => mcq._id),
      currentIndex,
      answers,
      skipped,
      remaining,
      startedAt: quizTiming.startedAt,
      expiresAt: quizTiming.expiresAt,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(quizStorageKey, JSON.stringify(draft))
  }, [answers, currentIndex, loading, mcqs, quizStorageKey, quizTiming, quizUserKey, remaining, skipped])

  useEffect(() => {
    if (loading || !mcqs.length) return undefined
    const savePausedDraft = () => localStorage.setItem(quizStorageKey, JSON.stringify({
      ownerKey: quizUserKey, mcqIds: mcqs.map((mcq) => mcq._id), currentIndex, answers, skipped, remaining,
      startedAt: quizTiming.startedAt, expiresAt: null, updatedAt: new Date().toISOString(),
    }))
    const handleVisibilityChange = () => {
      if (document.hidden) {
        savePausedDraft()
        setQuizTiming((timing) => ({ ...timing, expiresAt: null }))
      } else {
        setQuizTiming((timing) => ({ ...timing, expiresAt: timing.expiresAt || Date.now() + remaining * 1000 }))
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', savePausedDraft)
    window.addEventListener('beforeunload', savePausedDraft)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', savePausedDraft)
      window.removeEventListener('beforeunload', savePausedDraft)
    }
  }, [answers, currentIndex, loading, mcqs, quizStorageKey, quizTiming.startedAt, quizUserKey, remaining, skipped])

  useEffect(() => {
    if (loading || !mcqs.length) return undefined

    const baseState = {
      ...(window.history.state || {}),
      mcqAttemptBase: true,
    }
    window.history.replaceState(baseState, '')
    window.history.pushState({ ...baseState, mcqAttemptGuard: true }, '')

    const handleBack = (event) => {
      if (event.state?.mcqAttemptGuard) return

      const current = currentIndexRef.current
      setShowQuestionPanel(false)
      if (current > 0) {
        const previous = current - 1
        currentIndexRef.current = previous
        setCurrentIndex(previous)
      }

      window.history.forward()
    }

    window.addEventListener('popstate', handleBack)
    return () => window.removeEventListener('popstate', handleBack)
  }, [loading, mcqs.length])

  const submit = async ({ force = false } = {}) => {
    if (submitting || !mcqs.length) return
    if (!force) {
      const unansweredCount = mcqs.filter(
        (mcq) => answers[mcq._id] === undefined,
      ).length
      const skippedCount = mcqs.filter((mcq) => skipped[mcq._id]).length
      if (unansweredCount > 0 || skippedCount > 0) {
        toast.error(
          `Please attempt all MCQs before submitting. ${unansweredCount} unanswered, ${skippedCount} skipped.`,
        )
        return
      }
    }
    setSubmitting(true)
    try {
      const timeLimitSeconds = mcqs.length * 50
      const startedAt = Number(quizTiming.startedAt)
      const timeSpentSeconds = Math.min(
        timeLimitSeconds,
        Math.max(0, timeLimitSeconds - remaining),
      )
      const res = await API.post(`/mcqs/${subject}/${chapterId}/submit${testPartQuery}`, {
        answers,
        timeLimitSeconds,
        timeSpentSeconds,
        startedAt:
          Number.isFinite(startedAt) && startedAt > 0
            ? new Date(startedAt).toISOString()
            : undefined,
      })
      localStorage.removeItem(quizStorageKey)
      const resultPayload = JSON.stringify(res.data)
      const resultKey = getQuizResultStorageKey(quizUserKey, subject, chapterAttemptId)
      const legacyResultKey = getLegacyQuizResultStorageKey(subject, chapterAttemptId)
      localStorage.setItem(resultKey, resultPayload)
      sessionStorage.setItem(resultKey, resultPayload)
      sessionStorage.setItem(legacyResultKey, resultPayload)
      navigate(`/mcqs/${subject}/${chapterId}/result${testPartQuery}`, {
        replace: true,
        state: { result: res.data },
      })
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not submit the quiz right now.'))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!showQuestionPanel) return undefined
    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
    }
  }, [showQuestionPanel])

  useEffect(() => {
    if (!mcqs.length || submitting || !quizTiming.expiresAt) return undefined
    const tick = () => {
      const nextRemaining = Math.max(
        0,
        Math.ceil((Number(quizTiming.expiresAt) - Date.now()) / 1000),
      )
      setRemaining(nextRemaining)
      if (nextRemaining <= 0) {
        submit({ force: true })
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [mcqs.length, quizTiming.expiresAt, submitting]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = mcqs[currentIndex]
  const selected = current ? answers[current._id] : undefined
  const mcqDisplayNumberOffset = useMemo(
    () => getMcqDisplayNumberOffset(mcqs),
    [mcqs],
  )
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
    return (
      <div className="workspace-page">
        <EmptyState
          title="No MCQs available"
          text="This chapter has no published MCQs yet."
          action={
            <Link
              className="btn btn-primary"
              to={`/mcqs/${subject}/${chapterId}${testPartQuery}`}
            >
              Back to MCQs
            </Link>
          }
        />
      </div>
    )
  }

  const selectAnswer = (optionIndex) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [current._id]: optionIndex,
    }))
    setSkipped((currentSkipped) => ({
      ...currentSkipped,
      [current._id]: false,
    }))
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
      setSkipped((currentSkipped) => ({
        ...currentSkipped,
        [current._id]: true,
      }))
    }
    setCurrentIndex((index) => Math.min(mcqs.length - 1, index + 1))
  }

  const pauseAndExitQuiz = () => {
    localStorage.setItem(quizStorageKey, JSON.stringify({
      ownerKey: quizUserKey,
      mcqIds: mcqs.map((mcq) => mcq._id),
      currentIndex,
      answers,
      skipped,
      remaining,
      startedAt: quizTiming.startedAt,
      expiresAt: null,
      updatedAt: new Date().toISOString(),
    }))
    navigate(`/mcqs/${subject}/${chapterId}${testPartQuery}`)
  }

  return (
    <div className="mcq-practice-page animate-fade-up">
      <section className="mcq-practice-shell">
        <div className="mcq-practice-top">
          <div>
            <button className="mcq-exit-attempt" type="button" onClick={pauseAndExitQuiz}>
              <span aria-hidden="true">&#8592;</span>
              Back to chapter
            </button>
            <div className="label-xs" style={{ color: meta?.accent }}>
              {meta?.name}: {chapter?.name}
            </div>
            <p>
              Question {currentIndex + 1} of {mcqs.length}
            </p>
          </div>
          <div className="mcq-practice-tools">
            <button
              className="btn btn-secondary mcq-question-panel-toggle"
              type="button"
              onClick={() => setShowQuestionPanel(true)}
            >
              Questions
            </button>
            <div className="mcq-timer">
              {minutes}:{seconds}
            </div>
          </div>
        </div>

        <div className="mcq-attempt-layout">
          <div className="mcq-question-card">
            <div className="mcq-question-title">
              <MCQRenderer text={current.questionText || current.question} images={mcqQuestionImages(current)} />
            </div>
            {current.needsReview ? (
              <div className="mcq-under-review-badge">Under Review</div>
            ) : null}
            <div className="mcq-options-grid">
              {current.options.map((option, index) => (
                <button
                  key={`${current._id}-${index}`}
                  className={`mcq-option-card ${selected === index ? 'mcq-option-card--selected' : ''}`}
                  type="button"
                  onClick={() => selectAnswer(index)}
                  disabled={current.needsReview}
                >
                  <span className="mcq-option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <div className="mcq-option-text">
                    <MCQRenderer text={option.text || option} images={mcqOptionImages(current, option, String.fromCharCode(65 + index))} />
                  </div>
                </button>
              ))}
            </div>
            <div className="mcq-nav-actions">
              <button
                className="btn btn-secondary"
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((index) => index - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={skipQuestion}
              >
                Skip
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={currentIndex === mcqs.length - 1}
                onClick={nextQuestion}
              >
                Next
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => submit()}
                disabled={submitting}
              >
                Submit
              </button>
            </div>
          </div>

          {showQuestionPanel ? (
            <button
              className="mcq-question-backdrop"
              type="button"
              aria-label="Close question list"
              onClick={() => setShowQuestionPanel(false)}
            />
          ) : null}
          <aside
            className={`workspace-card mcq-question-sidebar ${showQuestionPanel ? 'mcq-question-sidebar--open' : ''}`}
          >
            <div className="workspace-card-head">
              <div>
                <div className="label-xs">Jump</div>
                <h3 className="workspace-card-title">Questions</h3>
              </div>
              <button
                className="mcq-question-close"
                type="button"
                onClick={() => setShowQuestionPanel(false)}
                aria-label="Close question list"
              >
                ×
              </button>
            </div>
            <div className="workspace-card-body mcq-question-dots">
              {mcqs.map((mcq, index) => {
                const answered = answers[mcq._id] !== undefined
                const isSkipped = skipped[mcq._id]
                return (
                  <button
                    key={mcq._id}
                    className={`mcq-dot ${index === currentIndex ? 'mcq-dot--active' : ''} ${answered ? 'mcq-dot--answered' : ''} ${isSkipped ? 'mcq-dot--skipped' : ''}`}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index)
                      setShowQuestionPanel(false)
                    }}
                  >
                    {getMcqDisplayNumber(mcq, index, mcqDisplayNumberOffset)}
                  </button>
                )
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
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const testPart = searchParams.get('testPart')
  const topicIdParam = searchParams.get('topicId')
  const chapterAttemptId = [
    chapterId,
    topicIdParam ? `topic-${topicIdParam}` : null,
    testPart ? `part-${testPart}` : null,
  ]
    .filter(Boolean)
    .join('-')
  const testPartQuery = (() => {
    const params = new URLSearchParams()
    if (topicIdParam) params.set('topicId', topicIdParam)
    if (testPart) params.set('testPart', testPart)
    const query = params.toString()
    return query ? `?${query}` : ''
  })()
  const quizUserKey = useMemo(
    () => user?.email || user?._id || user?.id || 'guest',
    [user?.email, user?._id, user?.id],
  )
  const result =
    location.state?.result || readStoredQuizResult(quizUserKey, subject, chapterAttemptId)

  const solveAgain = () => {
    clearStoredQuizResult(quizUserKey, subject, chapterAttemptId)
    navigate(`/mcqs/${subject}/${chapterId}/attempt${testPartQuery}`, {
      replace: true,
      state: { retake: true },
    })
  }
  if (!result) {
    return (
      <div className="workspace-page">
        <EmptyState
          title="Result unavailable"
          text="Submit a quiz attempt first to view the result page."
          action={
            <Link
              className="btn btn-primary"
              to={`/mcqs/${subject}/${chapterId}${testPartQuery}`}
            >
              Back to MCQs
            </Link>
          }
        />
      </div>
    )
  }
  const answerKeyItems = Array.isArray(result.detailed) ? result.detailed : []

  const pct = result.percentage || 0
  const motivation =
    pct >= 80
      ? 'Excellent performance! Keep it up.'
      : pct >= 60
        ? 'Good effort. Review the mistakes below to improve.'
        : 'Keep practicing, and review every explanation carefully.'

  return (
    <div className="mcq-review-page animate-fade-up">
      <section className="mcq-review-shell">
        <div className="mcq-review-top">
          <div>
            <div className="label-xs">
              {result.subject} &gt; {result.chapter?.name}
            </div>
            <h1>Quiz Result</h1>
            <p>
              {result.correct} correct · {result.wrong} wrong · {result.skipped}{' '}
              skipped
            </p>
          </div>
          <div className="inline-actions mcq-result-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={solveAgain}
            >
              Solve Again
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate(`/mcqs/${subject}/${chapterId}${testPartQuery}`)}
            >
              Back to MCQs
            </button>
          </div>
        </div>
        <div className="mcq-result-card">
          <div className="mcq-result-score">{result.percentage}%</div>
          <h2>
            {result.score} / {result.totalQuestions}
          </h2>
          <p>{motivation}</p>
        </div>
        <div
          className="review-stats-grid"
          style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
        >
          <div className="review-stat-card review-stat-card--purple">
            <span>Total MCQs</span>
            <strong>{result.totalQuestions}</strong>
          </div>
          <div className="review-stat-card review-stat-card--green">
            <span>Correct</span>
            <strong>{result.correct}</strong>
          </div>
          <div className="review-stat-card review-stat-card--red">
            <span>Wrong</span>
            <strong>{result.wrong}</strong>
          </div>
          <div className="review-stat-card review-stat-card--purple">
            <span>Skipped</span>
            <strong>{result.skipped}</strong>
          </div>
          <div className="review-stat-card review-stat-card--green">
            <span>Score</span>
            <strong>
              {result.score}/{result.totalQuestions}
            </strong>
          </div>
          <div className="review-stat-card review-stat-card--purple">
            <span>Percentage</span>
            <strong>{result.percentage}%</strong>
          </div>
        </div>
        <ReviewSection title="Answer Key & Explanations" items={answerKeyItems} />
      </section>
    </div>
  )
}

function ReviewSection({ title, items }) {
  return (
    <div className="review-question-stack">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="text-muted">No items in this section.</p>
      ) : null}
      {items.map((item, index) => (
        <article
          key={String(item.mcqId)}
          className={`review-question-card ${item.skipped ? 'review-question-card--wrong' : item.isCorrect ? 'review-question-card--correct' : 'review-question-card--wrong'}`}
        >
          <div className="review-question-top">
            <span className="review-question-number">
              Question {getMcqDisplayNumber(item, index)}
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
                  key={`${item.mcqId}-${optionIndex}`}
                  className={`review-option-row ${correct ? 'review-option-row--correct' : ''} ${selected && !correct ? 'review-option-row--wrong' : ''}`}
                >
                  <span className="review-option-letter">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <div className="review-option-text">
                    <MCQRenderer text={option.text || option} images={mcqOptionImages(item, option, String.fromCharCode(65 + optionIndex))} />
                  </div>
                  {selected ? (
                    <span className="review-option-tag">Your answer</span>
                  ) : null}
                  {correct ? (
                    <span className="review-option-tag review-option-tag--correct">
                      Correct answer
                    </span>
                  ) : null}
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
  )
}

export { CourseSelection, ChapterList, McqList, QuizAttempt, QuizResult }

export default CourseSelection








