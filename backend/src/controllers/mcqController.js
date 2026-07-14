const MCQ = require('../models/MCQ')
const Course = require('../models/Course')
const TestSession = require('../models/TestSession')
const ImportBatch = require('../models/ImportBatch')
const { parse } = require('csv-parse/sync')
const { hasActiveSubscription } = require('../utils/subscriptions')
const {
  getTeacherSubjects,
  canTeacherAccessSubject,
} = require('../utils/teacherSubjects')

const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English']
const SUBJECT_SLUGS = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  english: 'English',
}

const normalizeSubject = (value) =>
  SUBJECT_SLUGS[
    String(value || '')
      .trim()
      .toLowerCase()
  ] || null
const slugifyChapter = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')


const STUDENT_CHAPTER_TEST_SIZE = 70

const normalizeTestPart = (value) => {
  const part = Number(value)
  return Number.isInteger(part) && part >= 1 ? part : null
}

const sliceMcqsForVirtualTest = (mcqs, testPart) => {
  const part = normalizeTestPart(testPart)
  if (!part) return mcqs
  const start = (part - 1) * STUDENT_CHAPTER_TEST_SIZE
  return mcqs.slice(start, start + STUDENT_CHAPTER_TEST_SIZE)
}

const buildVirtualChapterTests = (chapter, totalMcqs) => {
  const count = Number(totalMcqs || 0)
  if (count <= STUDENT_CHAPTER_TEST_SIZE) return []
  const parts = Math.ceil(count / STUDENT_CHAPTER_TEST_SIZE)
  return Array.from({ length: parts }, (_, index) => {
    const part = index + 1
    const start = index * STUDENT_CHAPTER_TEST_SIZE + 1
    const end = Math.min(count, part * STUDENT_CHAPTER_TEST_SIZE)
    return {
      id: chapter.id,
      chapterId: chapter.id,
      testPart: part,
      name: `${chapter.name} - Test ${part}`,
      description: `${chapter.name} MCQs ${start}-${end}`,
      mcqCount: end - start + 1,
      rangeStart: start,
      rangeEnd: end,
    }
  })
}
const teacherRoleNames = new Set(['teacher', 'admin'])

const userRoleName = (user) =>
  user?.role?.name === 'superadmin' ? 'admin' : user?.role?.name

const canManageCourse = (course, user) => {
  const roleName = userRoleName(user)
  if (roleName === 'admin') return true
  if (roleName !== 'teacher' || user.status !== 'active') return false
  return canTeacherAccessSubject(user, course?.category || course?.subject)
}

const canManageSubject = (subject, user) => {
  const roleName = userRoleName(user)
  if (roleName === 'admin') return true
  if (roleName !== 'teacher' || user.status !== 'active') return false
  return canTeacherAccessSubject(user, subject)
}

const canAccessSubjectContent = (user, subject, contentIndex = 0) => {
  const roleName = userRoleName(user)
  if (roleName === 'admin') return true
  if (roleName === 'teacher') return canManageSubject(subject, user)
  if (roleName !== 'student') return false
  if (contentIndex === 0) return true
  return hasActiveSubscription(user, subject)
}

const canAccessChapterTest = (user, subject, contentIndex = 0, testPart = null) => {
  const roleName = userRoleName(user)
  if (roleName === 'admin') return true
  if (roleName === 'teacher') return canManageSubject(subject, user)
  if (roleName !== 'student') return false
  const part = normalizeTestPart(testPart)
  if (contentIndex === 0 && (!part || part === 1)) return true
  return hasActiveSubscription(user, subject)
}

const getChapterIndex = (course, chapterId) =>
  (course?.chapters || []).findIndex((chapter) => String(chapter.id) === String(chapterId))

const getSubjectCourse = async (subject) => {
  return Course.findOne({ category: subject })
    .select('_id category chapters name')
    .sort({ createdAt: 1 })
    .lean()
}

// Full Mongoose document — required for chapter CRUD that calls .save()
const getSubjectCourseFull = async (subject) => {
  return Course.findOne({ category: subject }).sort({ createdAt: 1 })
}

const ensureSubjectCourse = async (subject, user) => {
  let course = await getSubjectCourseFull(subject)
  if (course) return course

  course = await Course.create({
    name: subject,
    description: `${subject} MDCAT MCQ practice bank`,
    category: subject,
    subject,
    chapters: [],
    topics: [],
    createdBy: user.id,
    isPublished: true,
  })

  return course
}

const getChapter = (course, chapterId) =>
  (course.chapters || []).find(
    (chapter) => String(chapter.id) === String(chapterId),
  )

const getChapterTopics = (chapter) =>
  Array.isArray(chapter?.topics) ? chapter.topics : []
const getChapterReviewQueue = (chapter) =>
  Array.isArray(chapter?.reviewQueue) ? chapter.reviewQueue : []

const numericQuestionNumber = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const extracted = raw.match(/^\D*(\d+(?:\.\d+)?)\D*$/)?.[1] || raw
  const numeric = Number(extracted)
  return Number.isFinite(numeric) && numeric >= 1 ? numeric : null
}

const CSV_NUMBER_COLUMNS = [
  'question_number',
  'questionnumber',
  'question_no',
  'question no',
  'question no.',
  'questionno',
  'question_numbering',
  'qnumber',
  'q_no',
  'q no',
  'q.no',
  'qno',
  'no',
  'no.',
  'number',
  'sr',
  'sr_no',
  'sr no',
  'sr.no',
  'srno',
  's_no',
  's no',
  's.no',
  'serial',
  'serial_number',
]

const getExplicitCsvQuestionNumber = (row) =>
  getCsvValue(row, ...CSV_NUMBER_COLUMNS)

const normalizeCsvQuestionNumber = ({
  explicitQuestionNumber,
  csvRowIndex,
  rowNumber,
  headerCountedQuestionNumbers,
}) => {
  const explicit = String(explicitQuestionNumber || '').trim()
  if (!explicit) return String(csvRowIndex)

  const numeric = numericQuestionNumber(explicit)
  if (numeric === null) return String(csvRowIndex)
  if (numeric !== null && numeric === rowNumber && csvRowIndex === rowNumber - 1) {
    return String(csvRowIndex)
  }
  if (
    headerCountedQuestionNumbers &&
    numeric !== null &&
    numeric >= 2
  ) {
    return String(numeric - 1)
  }

  return explicit
}

const compareMcqOrder = (a, b) => {
  const aNumber = numericQuestionNumber(a?.originalQuestionNumber ?? a?.questionNumber)
  const bNumber = numericQuestionNumber(b?.originalQuestionNumber ?? b?.questionNumber)
  if (aNumber !== null && bNumber !== null && aNumber !== bNumber) {
    return aNumber - bNumber
  }
  if (aNumber !== null && bNumber === null) return -1
  if (aNumber === null && bNumber !== null) return 1

  const aRow = Number(a?.csvRowIndex)
  const bRow = Number(b?.csvRowIndex)
  if (Number.isFinite(aRow) && Number.isFinite(bRow) && aRow !== bRow) {
    return aRow - bRow
  }
  if (Number.isFinite(aRow) && !Number.isFinite(bRow)) return -1
  if (!Number.isFinite(aRow) && Number.isFinite(bRow)) return 1

  return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0)
}

const sortMcqsByOriginalOrder = (items = []) => [...items].sort(compareMcqOrder)

const getTopic = (chapter, topicId) =>
  getChapterTopics(chapter).find(
    (topic) => String(topic.id) === String(topicId),
  )

const createReviewQueueItemId = () =>
  `review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
const IMAGE_TAG_REGEX = /<img\b[^>]*>/gi
const IMAGE_SOURCE_REGEX = /\bsrc\s*=\s*["']([^"']+)["']/i
const IMAGE_ALT_REGEX = /\balt\s*=\s*["']([^"']*)["']/i
const MARKDOWN_IMAGE_REGEX = /!\[([\s\S]*?)\]\(([\s\S]*?)\)/gi
const IMAGE_TOKEN_REGEX =
  /\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):\s*([\s\S]*?)\]/gi
const IMAGE_URL_REGEX =
  /((?:(?:https?:\/\/)[^\s<>"']+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?)|(?:https?:\/\/res\.cloudinary\.com\/[^\s<>"']*?\/image\/upload\/[^\s<>"']+)|(?:\/uploads\/[^\s<>"']+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?)|(?:data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+))/gi

const encodeImageToken = ({ url, alt = '' }) =>
  `[IMAGE:${String(url || '').trim()}|alt=${String(alt || '').trim()}]`

const normalizeMediaMarkup = (value) =>
  String(value || '')
    .replace(IMAGE_TAG_REGEX, (tag) => {
      const srcMatch = tag.match(IMAGE_SOURCE_REGEX)
      if (!srcMatch?.[1]) return ''
      const altMatch = tag.match(IMAGE_ALT_REGEX)
      return encodeImageToken({ url: srcMatch[1], alt: altMatch?.[1] || '' })
    })
    .replace(MARKDOWN_IMAGE_REGEX, (_, alt, url) =>
      encodeImageToken({ url, alt }),
    )
    .replace(IMAGE_URL_REGEX, (url) => encodeImageToken({ url }))

const normalizeCsvCell = (value) => String(value ?? '')

const cleanImageUrl = (value) =>
  String(value || '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+["'][^"']*["']$/g, '')
    .replace(/[),.;\]]+$/g, '')

const isRenderableImageUrl = (value) => {
  const url = cleanImageUrl(value)
  if (/^\/uploads\/[^\s<>"']+/i.test(url)) return true
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/i.test(url)) return true
  if (!/^https?:\/\//i.test(url)) return false

  try {
    const parsed = new URL(url)
    const pathname = String(parsed.pathname || '').toLowerCase()
    const search = String(parsed.search || '').toLowerCase()
    const host = parsed.hostname.toLowerCase()
    const extMatch = pathname.match(
      /\.(png|jpe?g|gif|webp|svg|bmp|avif)(?:$|[?#])/i,
    )
    if (extMatch) return true
    if (host.includes('cloudinary.com') && pathname.includes('/image/upload/')) {
      return true
    }
    if (search.includes('format=png') || search.includes('format=jpg') || search.includes('format=jpeg') || search.includes('format=webp')) {
      return true
    }
    return false
  } catch {
    return false
  }
}

const extractImageUrlFromField = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return null

  const markerMatch = raw.match(
    /\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):\s*([\s\S]*?)\]/i,
  )
  if (markerMatch?.[1]) {
    const candidate = cleanImageUrl(markerMatch[1].split('|')[0])
    return isRenderableImageUrl(candidate) ? candidate : null
  }

  if (isRenderableImageUrl(raw)) return raw
  return null
}

const appendImageReference = (text, imageUrl, alt = '') => {
  const base = normalizeCsvCell(text)
  const existing = extractImageUrlFromField(base)
  if (existing || !imageUrl) return base

  const token = encodeImageToken({ url: imageUrl, alt })
  return base ? `${base}\n${token}` : token
}

const normalizeImageArray = (...values) => {
  const urls = []
  const push = (value) => {
    if (!value) return
    if (Array.isArray(value)) {
      value.forEach(push)
      return
    }
    if (typeof value === 'object') {
      push(value.secure_url || value.url || value.src || value.imageUrl || value.path)
      return
    }
    const extracted = extractImageUrlFromField(value) || cleanImageUrl(value)
    if (isRenderableImageUrl(extracted)) urls.push(extracted)
  }
  values.forEach(push)
  return [...new Set(urls)]
}

const extractImagesAndCleanText = (value, extraImages = []) => {
  let text = normalizeCsvCell(value)
  const images = []
  const add = (candidate) => {
    const url = extractImageUrlFromField(candidate) || cleanImageUrl(candidate)
    if (isRenderableImageUrl(url)) images.push(url)
  }

  text = text.replace(IMAGE_TAG_REGEX, (tag) => {
    const srcMatch = tag.match(IMAGE_SOURCE_REGEX)
    if (srcMatch?.[1]) add(srcMatch[1])
    return ''
  })

  text = text.replace(MARKDOWN_IMAGE_REGEX, (_, alt, url) => {
    add(url)
    return alt ? String(alt).trim() : ''
  })

  text = text.replace(IMAGE_TOKEN_REGEX, (_, body) => {
    add(String(body || '').split('|')[0])
    return ''
  })

  text = text.replace(IMAGE_URL_REGEX, (url) => {
    add(url)
    return ''
  })

  const finalImages = normalizeImageArray(images, extraImages)
  return {
    text: text.replace(/\n{3,}/g, '\n\n').trim(),
    images: finalImages,
  }
}

const optionImagesForLetter = (mcq, letter, option) =>
  normalizeImageArray(
    mcq?.[`option${letter}Images`],
    option?.images,
  )

const serializeMcqMedia = (mcq) => {
  if (!mcq) return mcq
  const plain = typeof mcq.toObject === 'function' ? mcq.toObject() : { ...mcq }
  const optionValues = ['A', 'B', 'C', 'D'].map((letter, index) => {
    const option = plain.options?.[index] || {}
    const text = plain[`option${letter}`] || option.text || ''
    const images = optionImagesForLetter(plain, letter, option)
    return {
      letter,
      text,
      images,
      isCorrect: option.isCorrect,
    }
  })

  const questionLegacy = extractImagesAndCleanText(plain.question || '')
  const explanationLegacy = extractImagesAndCleanText(plain.explanation || '')
  const questionText = plain.questionText || questionLegacy.text || plain.question || ''
  const explanationText = plain.explanationText || explanationLegacy.text || plain.explanation || ''
  const questionImages = normalizeImageArray(plain.questionImages, questionLegacy.images)
  const explanationImages = normalizeImageArray(plain.explanationImages, explanationLegacy.images)

  return {
    ...plain,
    question: questionText,
    questionText,
    questionImages,
    explanation: explanationText,
    explanationText,
    explanationImages,
    optionA: optionValues[0].text,
    optionAImages: optionValues[0].images,
    optionB: optionValues[1].text,
    optionBImages: optionValues[1].images,
    optionC: optionValues[2].text,
    optionCImages: optionValues[2].images,
    optionD: optionValues[3].text,
    optionDImages: optionValues[3].images,
    options: optionValues.map((option) => ({
      text: option.text,
      images: option.images,
      isCorrect: option.isCorrect,
    })),
  }
}

const serializeMcqsMedia = (mcqs) => mcqs.map(serializeMcqMedia)

const hasLatex = (text) =>
  /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/.test(String(text || ''))
const hasDiagram = (text) => /\[DIAGRAM:\s*.*?\]/i.test(String(text || ''))
const hasImageReference = (text) =>
  Boolean(extractImageUrlFromField(text)) ||
  /\[(?:IMAGE|IMG|PIC|PICTURE|FIGURE|SCREENSHOT|SS):\s*.*?\]/i.test(
    String(text || ''),
  )
const hasUnavailableDiagram = (text) =>
  /\[DIAGRAM:\s*unavailable\s*\]/i.test(String(text || ''))

const stripWrappedMath = (text) =>
  String(text || '').replace(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g, ' ')

const hasRawLatexLikeText = (text) => {
  const stripped = stripWrappedMath(text)
  return /\\rightarrow|\\rightleftharpoons|_\{|(?<!\\)\^\{/.test(stripped)
}

const normalizeCsvCorrectAnswer = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
  if (!normalized) return ''
  if (['a', 'b', 'c', 'd'].includes(normalized)) return normalized
  const first = normalized[0]
  return ['a', 'b', 'c', 'd'].includes(first) ? first : normalized
}

const countPresentOptions = (options) =>
  options.filter((option) => String(option || '').trim()).length

const determineReviewReasons = ({
  question,
  optionA,
  optionB,
  optionC,
  optionD,
  correctAnswer,
  explanation,
  explicitNeedsReview,
}) => {
  const reasons = []
  if (!question) reasons.push('Question is empty')
  if (!optionA) reasons.push('Option A is empty')
  if (!optionB) reasons.push('Option B is empty')
  if (!optionC) reasons.push('Option C is empty')
  if (!optionD) reasons.push('Option D is empty')
  if (!['a', 'b', 'c', 'd'].includes(correctAnswer)) {
    reasons.push('correct_answer must be a, b, c, or d')
  }
  if (!explanation) reasons.push('Explanation is empty')
  if (hasUnavailableDiagram(question))
    reasons.push('Diagram description unavailable')

  const cells = [question, optionA, optionB, optionC, optionD, explanation]
  if (cells.some((cell) => hasRawLatexLikeText(cell))) {
    reasons.push('Contains raw LaTeX-like text outside math wrappers')
  }
  if (explicitNeedsReview) {
    reasons.push('Flagged by CSV generator')
  }
  return [...new Set(reasons)]
}

const buildReviewQueueItem = ({
  rowNumber,
  csvRowIndex,
  questionNumber,
  importBatchId,
  validationErrors = [],
  context,
  question,
  questionImages = [],
  optionA,
  optionAImages = [],
  optionB,
  optionBImages = [],
  optionC,
  optionCImages = [],
  optionD,
  optionDImages = [],
  correctAnswer,
  explanation,
  explanationImages = [],
  rawRow,
  reason,
}) => ({
  id: createReviewQueueItemId(),
  row: rowNumber,
  questionNumber: String(questionNumber || csvRowIndex || rowNumber || '').trim(),
  originalQuestionNumber: String(questionNumber || csvRowIndex || rowNumber || '').trim(),
  originalQuestionNumberSort: numericQuestionNumber(questionNumber || csvRowIndex || rowNumber),
  csvRowIndex,
  importBatchId,
  importStatus: 'review',
  validationErrors,
  topicId: context.topic?.id || null,
  topicName: context.topic?.name || null,
  reason,
  question,
  questionText: question,
  questionImages,
  optionA,
  optionAImages,
  optionB,
  optionBImages,
  optionC,
  optionCImages,
  optionD,
  optionDImages,
  correctAnswer: String(correctAnswer || '').toUpperCase(),
  explanation,
  explanationText: explanation,
  explanationImages,
  rawRow: rawRow.map((cell) => String(cell || '')),
  createdAt: new Date(),
})

const createMcqDocFromRow = ({
  context,
  question,
  questionImages = [],
  optionA,
  optionAImages = [],
  optionB,
  optionBImages = [],
  optionC,
  optionCImages = [],
  optionD,
  optionDImages = [],
  correctAnswer,
  explanation,
  explanationImages = [],
  questionNumber = null,
  originalQuestionNumber = null,
  csvRowIndex = null,
  importBatchId = null,
  importStatus = 'imported',
  validationErrors = [],
  createdBy,
  reviewReason = null,
}) => {
  const questionMedia = extractImagesAndCleanText(question, questionImages)
  const explanationMedia = extractImagesAndCleanText(explanation, explanationImages)
  const options = normalizeOptionsFromLetters({
    optionA,
    optionAImages,
    optionB,
    optionBImages,
    optionC,
    optionCImages,
    optionD,
    optionDImages,
    correctAnswer: String(correctAnswer || '').toUpperCase(),
  })
  const fields = [questionMedia.text, ...options.map((option) => option.text), explanationMedia.text]
  const imageGroups = [questionMedia.images, explanationMedia.images, ...options.map((option) => option.images)]
  return {
    courseId: context.course._id,
    topic: context.topic?.name || context.chapter.name,
    subject: context.subject,
    chapterId: context.chapter.id,
    chapterName: context.chapter.name,
    topicId: context.topic?.id || null,
    question: questionMedia.text,
    questionText: questionMedia.text,
    questionImages: questionMedia.images,
    options,
    optionA: options[0]?.text || '',
    optionAImages: options[0]?.images || [],
    optionB: options[1]?.text || '',
    optionBImages: options[1]?.images || [],
    optionC: options[2]?.text || '',
    optionCImages: options[2]?.images || [],
    optionD: options[3]?.text || '',
    optionDImages: options[3]?.images || [],
    explanation: explanationMedia.text || null,
    explanationText: explanationMedia.text,
    explanationImages: explanationMedia.images,
    difficulty: 'medium',
    createdBy,
    isPublished: true,
    correctAnswer: String(correctAnswer || '').toUpperCase(),
    needsReview: false,
    hasDiagram: fields.some(hasDiagram) || imageGroups.some((images) => images?.length),
    hasLatex: fields.some(hasLatex),
    reviewReason,
    questionNumber: String(questionNumber || originalQuestionNumber || csvRowIndex || '').trim() || null,
    originalQuestionNumber: String(originalQuestionNumber || questionNumber || csvRowIndex || '').trim() || null,
    originalQuestionNumberSort: numericQuestionNumber(originalQuestionNumber || questionNumber || csvRowIndex),
    csvRowIndex,
    importBatchId,
    importStatus,
    validationErrors,
  }
}

const normalizeOptionsFromLetters = ({
  optionA,
  optionAImages = [],
  optionB,
  optionBImages = [],
  optionC,
  optionCImages = [],
  optionD,
  optionDImages = [],
  correctAnswer,
}) => {
  const letters = ['A', 'B', 'C', 'D']
  const values = [optionA, optionB, optionC, optionD]
  const imageValues = [optionAImages, optionBImages, optionCImages, optionDImages]
  const normalizedAnswer = String(correctAnswer || '')
    .trim()
    .toUpperCase()
  return values.map((text, index) => {
    const media = extractImagesAndCleanText(text, imageValues[index])
    return {
      text: media.text,
      images: media.images,
      isCorrect: letters[index] === normalizedAnswer,
    }
  })
}

const parseCsv = (csvText) => {
  const rows = []
  let current = ''
  let row = []
  let quoted = false
  let atCellStart = true

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i]
    const next = csvText[i + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"' && quoted) {
      quoted = !quoted
    } else if (char === '"' && atCellStart) {
      quoted = true
    } else if (char === ',' && !quoted) {
      row.push(current)
      current = ''
      atCellStart = true
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(current)
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
      row = []
      current = ''
      atCellStart = true
    } else {
      current += char
      atCellStart = false
    }
  }

  row.push(current)
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
  return rows
}

const normalizeCsvRowToHeaders = (row, headers) => {
  if (!Array.isArray(row)) return []
  if (!Array.isArray(headers) || !headers.length) return row
  if (row.length <= headers.length) return row

  const questionIndex = headers.indexOf('question')
  if (questionIndex !== 0) return row

  const overflowCount = row.length - headers.length
  const mergedQuestion = row.slice(0, overflowCount + 1).join(',')
  return [mergedQuestion, ...row.slice(overflowCount + 1)]
}

const getCsvValue = (row, ...keys) => {
  const compact = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const key of keys) {
    const normalized = String(key || '').trim().toLowerCase()
    if (Object.prototype.hasOwnProperty.call(row, normalized)) {
      return row[normalized]
    }
    const compactKey = compact(key)
    const matchingEntry = Object.entries(row).find(
      ([rowKey]) => compact(rowKey) === compactKey,
    )
    if (matchingEntry) return matchingEntry[1]
  }
  return ''
}

const csvImageArray = (row, ...keys) =>
  normalizeImageArray(...keys.map((key) => getCsvValue(row, key)))

const hasCorrectOption = (options) => {
  return Array.isArray(options) && options.some((opt) => opt.isCorrect === true)
}

// ==================== CREATE MCQ (Teacher/Admin) ====================
exports.createMcq = async (req, res) => {
  try {
    const {
      courseId,
      topic,
      subject,
      chapterId,
      chapterName,
      topicId,
      question,
      questionText,
      questionImages,
      imageUrl,
      imageUrls,
      images,
      options,
      explanation,
      explanationText,
      explanationImages,
      difficulty,
      year,
      isPastPaper,
      isPublished,
    } = req.body
    const questionMedia = extractImagesAndCleanText(questionText ?? question, [
      questionImages,
      imageUrl,
      imageUrls,
      images,
    ])
    const sanitizedOptions = Array.isArray(options)
      ? options.map((option, index) => {
          const letter = ['A', 'B', 'C', 'D'][index]
          const media = extractImagesAndCleanText(option?.text, [
            option?.images,
            req.body?.[`option${letter}Images`],
          ])
          return {
            ...option,
            text: media.text,
            images: media.images,
          }
        })
      : options
    const explanationMedia = extractImagesAndCleanText(explanationText ?? explanation, explanationImages)

    if (!courseId || !topic || !questionMedia.text || !sanitizedOptions) {
      return res
        .status(400)
        .json({ error: 'Please provide all required fields' })
    }

    if (!hasCorrectOption(sanitizedOptions)) {
      return res
        .status(400)
        .json({ error: 'At least one option must be correct' })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to add MCQs to this course' })
    }

    const nextSubject = userRoleName(req.user) === 'teacher'
      ? course.category
      : subject || course.category

    const mcq = await MCQ.create({
      courseId,
      topic,
      question: questionMedia.text,
      questionText: questionMedia.text,
      questionImages: questionMedia.images,
      options: sanitizedOptions,
      optionA: sanitizedOptions?.[0]?.text || '',
      optionAImages: sanitizedOptions?.[0]?.images || [],
      optionB: sanitizedOptions?.[1]?.text || '',
      optionBImages: sanitizedOptions?.[1]?.images || [],
      optionC: sanitizedOptions?.[2]?.text || '',
      optionCImages: sanitizedOptions?.[2]?.images || [],
      optionD: sanitizedOptions?.[3]?.text || '',
      optionDImages: sanitizedOptions?.[3]?.images || [],
      explanation: explanationMedia.text || null,
      explanationText: explanationMedia.text,
      explanationImages: explanationMedia.images,
      subject: nextSubject,
      chapterId: chapterId || null,
      chapterName: chapterName || topic,
      topicId: topicId || null,
      difficulty: difficulty || 'medium',
      year: year || null,
      isPastPaper: isPastPaper || false,
      createdBy: req.user.id,
      isPublished: typeof isPublished === 'boolean' ? isPublished : false,
      correctAnswer:
        ['A', 'B', 'C', 'D'][
          sanitizedOptions.findIndex((option) => option.isCorrect)
        ] || null,
      hasDiagram: [
        questionMedia.text,
        ...sanitizedOptions.map((option) => option?.text),
        explanationMedia.text,
      ].some((value) => hasDiagram(value)) ||
        [questionMedia.images, explanationMedia.images, ...sanitizedOptions.map((option) => option?.images)].some((images) => images?.length),
      hasLatex: [
        questionMedia.text,
        ...sanitizedOptions.map((option) => option?.text),
        explanationMedia.text,
      ].some(hasLatex),
    })

    res.status(201).json({
      success: true,
      message: 'MCQ created successfully',
      mcq: serializeMcqMedia(mcq),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const stripCorrectOptions = (mcqs) => {
  return mcqs.map((mcq) => {
    const normalized = serializeMcqMedia(mcq)
    const { correctAnswer, explanation, explanationText, explanationImages, ...safeMcq } = normalized
    return {
      ...safeMcq,
      options: normalized.options?.map((opt) => ({
        text: opt.text,
        images: opt.images || [],
      })) || [],
    }
  })
}

// ==================== GET MCQS BY COURSE (Student-safe) ====================
exports.getMcqsByCourse = async (req, res) => {
  try {
    const filter = {
      courseId: req.params.courseId,
      isPublished: true,
    }

    // Optional topic filter
    if (req.query.topic) {
      filter.topic = req.query.topic
    }

    // Optional difficulty filter
    if (req.query.difficulty) {
      filter.difficulty = req.query.difficulty
    }

    // Optional past paper filter
    if (req.query.isPastPaper === 'true') {
      filter.isPastPaper = true
    }
    if (req.query.year) {
      filter.year = Number(req.query.year)
    }

    // Randomize option
    const limit = parseInt(req.query.limit, 10) || 0

    let query = MCQ.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .lean()

    if (limit > 0) {
      // Return random questions for mock tests
      const mcqs = await MCQ.aggregate([
        { $match: filter },
        { $sample: { size: limit } },
      ])
      const safeMcqs = stripCorrectOptions(mcqs)
      return res.status(200).json({
        success: true,
        count: safeMcqs.length,
        mcqs: safeMcqs,
      })
    }

    const mcqs = sortMcqsByOriginalOrder(await query.sort({ createdAt: 1 }))
    const safeMcqs = stripCorrectOptions(mcqs)

    res.status(200).json({
      success: true,
      count: safeMcqs.length,
      mcqs: safeMcqs,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET TOPICS FOR COURSE ====================
exports.getTopicsByCourse = async (req, res) => {
  try {
    const topics = await MCQ.distinct('topic', {
      courseId: req.params.courseId,
      isPublished: true,
    })

    res.status(200).json({
      success: true,
      topics,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET MCQS BY COURSE (Teacher/Admin) ====================
exports.getMcqsByCourseFull = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).select('category subject')
    if (!course) return res.status(404).json({ error: 'Course not found' })
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ error: 'Not authorized to manage this subject' })
    }

    const filter = { courseId: req.params.courseId }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(
      200,
      Math.max(1, parseInt(req.query.limit, 10) || 50),
    )
    const skip = (page - 1) * limit

    const [mcqs, total] = await Promise.all([
      MCQ.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: 1 })
        .lean(),
      MCQ.countDocuments(filter),
    ])
    const pagedMcqs = sortMcqsByOriginalOrder(mcqs).slice(skip, skip + limit)

    res.status(200).json({
      success: true,
      count: pagedMcqs.length,
      mcqs: serializeMcqsMedia(pagedMcqs),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE MCQ ====================
exports.updateMcq = async (req, res) => {
  try {
    const {
      topic,
      subject,
      chapterId,
      chapterName,
      topicId,
      question,
      questionText,
      questionImages,
      imageUrl,
      imageUrls,
      images,
      options,
      explanation,
      explanationText,
      explanationImages,
      difficulty,
      year,
      isPastPaper,
      isPublished,
      needsReview,
      hasDiagram: incomingHasDiagram,
      hasLatex: incomingHasLatex,
      reviewReason,
    } = req.body

    let mcq = await MCQ.findById(req.params.mcqId).populate('courseId', 'category subject')

    if (!mcq) {
      return res.status(404).json({ error: 'MCQ not found' })
    }

    if (!canManageCourse(mcq.courseId, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this MCQ' })
    }

    const questionMedia =
      question === undefined && questionText === undefined && questionImages === undefined && imageUrl === undefined && imageUrls === undefined && images === undefined
        ? null
        : extractImagesAndCleanText(questionText ?? question ?? mcq.question ?? '', [
            questionImages,
            imageUrl,
            imageUrls,
            images,
          ])
    const sanitizedOptions = Array.isArray(options)
      ? options.map((option, index) => {
          const letter = ['A', 'B', 'C', 'D'][index]
          const media = extractImagesAndCleanText(option?.text, [
            option?.images,
            req.body?.[`option${letter}Images`],
          ])
          return {
            ...option,
            text: media.text,
            images: media.images,
          }
        })
      : options
    const explanationMedia =
      explanation === undefined && explanationText === undefined && explanationImages === undefined
        ? null
        : extractImagesAndCleanText(explanationText ?? explanation ?? mcq.explanation ?? '', explanationImages)

    if (sanitizedOptions && !hasCorrectOption(sanitizedOptions)) {
      return res
        .status(400)
        .json({ error: 'At least one option must be correct' })
    }

    const nextSubject = userRoleName(req.user) === 'teacher'
      ? mcq.subject
      : subject

    mcq = await MCQ.findByIdAndUpdate(
      req.params.mcqId,
      {
        topic,
        subject: nextSubject,
        chapterId,
        chapterName,
        topicId,
        question: questionMedia ? questionMedia.text : undefined,
        questionText: questionMedia ? questionMedia.text : undefined,
        questionImages: questionMedia ? questionMedia.images : undefined,
        options: sanitizedOptions,
        optionA: sanitizedOptions ? sanitizedOptions?.[0]?.text || '' : undefined,
        optionAImages: sanitizedOptions ? sanitizedOptions?.[0]?.images || [] : undefined,
        optionB: sanitizedOptions ? sanitizedOptions?.[1]?.text || '' : undefined,
        optionBImages: sanitizedOptions ? sanitizedOptions?.[1]?.images || [] : undefined,
        optionC: sanitizedOptions ? sanitizedOptions?.[2]?.text || '' : undefined,
        optionCImages: sanitizedOptions ? sanitizedOptions?.[2]?.images || [] : undefined,
        optionD: sanitizedOptions ? sanitizedOptions?.[3]?.text || '' : undefined,
        optionDImages: sanitizedOptions ? sanitizedOptions?.[3]?.images || [] : undefined,
        explanation: explanationMedia ? explanationMedia.text : undefined,
        explanationText: explanationMedia ? explanationMedia.text : undefined,
        explanationImages: explanationMedia ? explanationMedia.images : undefined,
        difficulty,
        year,
        isPastPaper,
        isPublished,
        needsReview,
        hasDiagram:
          typeof incomingHasDiagram === 'boolean'
            ? incomingHasDiagram
            : questionMedia || explanationMedia || sanitizedOptions
              ? [
                questionMedia?.text,
                ...(sanitizedOptions || []).map((option) => option?.text),
                explanationMedia?.text,
              ].some((value) => hasDiagram(value)) ||
                Boolean(questionMedia?.images?.length || explanationMedia?.images?.length) ||
                (sanitizedOptions || []).some((option) => option?.images?.length)
              : mcq.hasDiagram,
        hasLatex:
          typeof incomingHasLatex === 'boolean'
            ? incomingHasLatex
            : questionMedia || explanationMedia || sanitizedOptions
              ? [
                questionMedia?.text,
                ...(sanitizedOptions || []).map((option) => option?.text),
                explanationMedia?.text,
              ].some(hasLatex)
              : mcq.hasLatex,
        reviewReason: reviewReason || null,
        correctAnswer: sanitizedOptions
          ? ['A', 'B', 'C', 'D'][
              sanitizedOptions.findIndex((option) => option.isCorrect)
            ] || null
          : mcq.correctAnswer,
      },
      { new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      message: 'MCQ updated successfully',
      mcq: serializeMcqMedia(mcq),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DELETE MCQ ====================
exports.deleteMcq = async (req, res) => {
  try {
    const mcq = await MCQ.findById(req.params.mcqId).populate('courseId', 'category subject')

    if (!mcq) {
      return res.status(404).json({ error: 'MCQ not found' })
    }

    if (!canManageCourse(mcq.courseId, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to delete this MCQ' })
    }

    await MCQ.findByIdAndDelete(req.params.mcqId)

    res.status(200).json({
      success: true,
      message: 'MCQ deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== MDCAT SUBJECT SUMMARY ====================
exports.getSubjectSummary = async (req, res) => {
  try {
    const allowedSubjects =
      userRoleName(req.user) === 'teacher'
        ? SUBJECTS.filter((subject) => getTeacherSubjects(req.user).includes(subject))
        : SUBJECTS
    const courses = await Course.find({ category: { $in: allowedSubjects } })
      .select('_id category chapters')
      .lean()
    const courseBySubject = new Map(
      courses.map((course) => [course.category, course]),
    )
    const courseIds = courses.map((course) => course._id)

    const mcqCounts = await MCQ.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: '$subject',
          totalMcqs: { $sum: 1 },
        },
      },
    ])
    const mcqCountBySubject = new Map(
      mcqCounts.map((item) => [item._id, item.totalMcqs]),
    )

    const subjects = allowedSubjects.map((subject) => {
      const course = courseBySubject.get(subject)
      return {
        id: subject.toLowerCase(),
        subject,
        courseId: course?._id || null,
        totalChapters: course?.chapters?.length || 0,
        totalMcqs: mcqCountBySubject.get(subject) || 0,
      }
    })

    res.status(200).json({ success: true, subjects })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== CHAPTERS BY SUBJECT ====================
exports.getChaptersBySubject = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })
    if (userRoleName(req.user) === 'teacher' && !canManageSubject(subject, req.user)) {
      return res.status(403).json({ error: 'Not authorized to access this subject' })
    }

    const course = await getSubjectCourse(subject)
    if (!course) {
      return res
        .status(200)
        .json({ success: true, subject, courseId: null, chapters: [] })
    }

    const counts = await MCQ.aggregate([
      { $match: { courseId: course._id, subject } },
      { $group: { _id: '$chapterId', totalMcqs: { $sum: 1 } } },
    ])
    const countByChapter = new Map(
      counts.map((item) => [item._id, item.totalMcqs]),
    )

    const topicCounts = await MCQ.aggregate([
      { $match: { courseId: course._id, subject, topicId: { $ne: null } } },
      {
        $group: {
          _id: { chapterId: '$chapterId', topicId: '$topicId' },
          totalMcqs: { $sum: 1 },
        },
      },
    ])
    const topicCountByKey = new Map(
      topicCounts.map((item) => [
        `${item._id.chapterId}:${item._id.topicId}`,
        item.totalMcqs,
      ]),
    )

    const chapters = (course.chapters || []).flatMap((chapter, index) => {
      const baseLocked = !canAccessChapterTest(req.user, subject, index)
      const mcqCount = countByChapter.get(chapter.id) || 0
      const baseChapter = {
        id: chapter.id,
        name: chapter.name,
        description: chapter.description || '',
        mcqCount,
        isLocked: baseLocked,
        lockReason: baseLocked
          ? 'Please subscribe to access this test/past paper.'
          : null,
        topics: getChapterTopics(chapter).map((topic) => ({
          id: topic.id,
          name: topic.name,
          description: topic.description || '',
          mcqCount: topicCountByKey.get(`${chapter.id}:${topic.id}`) || 0,
        })),
      }

      if (teacherRoleNames.has(userRoleName(req.user))) return [baseChapter]
      const virtualTests = buildVirtualChapterTests(chapter, mcqCount)
      if (!virtualTests.length) return [baseChapter]
      return virtualTests.map((test) => {
        const locked = !canAccessChapterTest(req.user, subject, index, test.testPart)
        return {
          ...baseChapter,
          ...test,
          originalChapterName: chapter.name,
          isVirtualTest: true,
          isLocked: locked,
          lockReason: locked ? 'Please subscribe to access this test/past paper.' : null,
        }
      })
    })

    res
      .status(200)
      .json({ success: true, subject, courseId: course._id, chapters })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== CREATE CHAPTER ====================
exports.createChapter = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const name = String(req.body.name || '').trim()
    const description = String(req.body.description || '').trim()
    if (!name)
      return res.status(400).json({ error: 'Chapter name is required' })

    const course = await ensureSubjectCourse(subject, req.user)
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const baseId = slugifyChapter(name)
    const existingIds = new Set(
      (course.chapters || []).map((chapter) => chapter.id),
    )
    let chapterId = baseId
    let counter = 2
    while (existingIds.has(chapterId)) {
      chapterId = `${baseId}-${counter}`
      counter += 1
    }

    course.chapters.push({ id: chapterId, name, description })
    await course.save()

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      courseId: course._id,
      chapter: { id: chapterId, name, description, mcqCount: 0, topics: [] },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE CHAPTER ====================
exports.updateChapter = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const name = String(req.body.name || '').trim()
    if (!name)
      return res.status(400).json({ error: 'Chapter name is required' })

    chapter.name = name
    chapter.description = String(req.body.description || '').trim()
    await course.save()

    await MCQ.updateMany(
      { courseId: course._id, chapterId: chapter.id },
      { chapterName: chapter.name },
    )

    await MCQ.updateMany(
      {
        courseId: course._id,
        chapterId: chapter.id,
        $or: [{ topicId: null }, { topicId: { $exists: false } }],
      },
      { topic: chapter.name },
    )

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      chapter: {
        id: chapter.id,
        name: chapter.name,
        description: chapter.description || '',
        topics: getChapterTopics(chapter),
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DELETE CHAPTER ====================
exports.deleteChapter = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const mcqFilter = { courseId: course._id, chapterId: chapter.id }
    const mcqCount = await MCQ.countDocuments(mcqFilter)

    course.chapters = course.chapters.filter((item) => item.id !== chapter.id)
    await Promise.all([
      course.save(),
      MCQ.deleteMany(mcqFilter),
      TestSession.deleteMany(mcqFilter),
    ])

    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully',
      deletedMcqs: mcqCount,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== CREATE TOPIC ====================
exports.createTopic = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const name = String(req.body.name || '').trim()
    const description = String(req.body.description || '').trim()
    if (!name) return res.status(400).json({ error: 'Topic name is required' })

    const baseId = slugifyChapter(name)
    const existingIds = new Set(
      getChapterTopics(chapter).map((topic) => topic.id),
    )
    let topicId = baseId
    let counter = 2
    while (existingIds.has(topicId)) {
      topicId = `${baseId}-${counter}`
      counter += 1
    }

    chapter.topics = getChapterTopics(chapter)
    chapter.topics.push({ id: topicId, name, description })
    await course.save()

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topic: { id: topicId, name, description, mcqCount: 0 },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE TOPIC ====================
exports.updateTopic = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const topic = getTopic(chapter, req.params.topicId)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })

    const name = String(req.body.name || '').trim()
    const description = String(req.body.description || '').trim()
    if (!name) return res.status(400).json({ error: 'Topic name is required' })

    topic.name = name
    topic.description = description
    await course.save()

    await MCQ.updateMany(
      { courseId: course._id, chapterId: chapter.id, topicId: topic.id },
      { topic: topic.name },
    )

    res.status(200).json({
      success: true,
      message: 'Topic updated successfully',
      topic: {
        id: topic.id,
        name: topic.name,
        description: topic.description || '',
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DELETE TOPIC ====================
exports.deleteTopic = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const topic = getTopic(chapter, req.params.topicId)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })

    const mcqCount = await MCQ.countDocuments({
      courseId: course._id,
      chapterId: chapter.id,
      topicId: topic.id,
    })
    if (mcqCount > 0) {
      return res
        .status(400)
        .json({ error: 'Cannot delete topic while MCQs exist inside it' })
    }

    chapter.topics = getChapterTopics(chapter).filter(
      (item) => item.id !== topic.id,
    )
    await course.save()

    res
      .status(200)
      .json({ success: true, message: 'Topic deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const resolveChapterTopicContext = (chapter, topicId) => {
  if (!topicId) {
    return { topic: null, topicFilter: {} }
  }

  const topic = getTopic(chapter, topicId)
  if (!topic) return { error: 'Topic not found' }
  return { topic, topicFilter: { topicId: topic.id } }
}

const buildChapterMcqFilter = async (
  subjectParam,
  chapterId,
  includeUnpublished = false,
  topicId = null,
) => {
  const subject = normalizeSubject(subjectParam)
  if (!subject) return { error: 'Invalid subject' }

  const course = await getSubjectCourse(subject)
  if (!course) return { subject, course: null, chapter: null, filter: null }

  const chapter = getChapter(course, chapterId)
  if (!chapter) return { subject, course, chapter: null, filter: null }

  const topicContext = resolveChapterTopicContext(chapter, topicId)
  if (topicContext.error) return { error: topicContext.error }

  const filter = {
    courseId: course._id,
    subject,
    chapterId: chapter.id,
    ...topicContext.topicFilter,
  }
  if (!includeUnpublished) filter.isPublished = true
  return { subject, course, chapter, topic: topicContext.topic, filter }
}

// ==================== MCQS BY CHAPTER ====================
exports.getMcqsByChapter = async (req, res) => {
  try {
    const role = req.user?.role?.name
    const includeFull = teacherRoleNames.has(role)
    const context = await buildChapterMcqFilter(
      req.params.subject,
      req.params.chapterId,
      includeFull,
      req.query.topicId || null,
    )
    if (context.error) return res.status(400).json({ error: context.error })
    if (!context.course || !context.chapter) {
      return res.status(200).json({
        success: true,
        subject: context.subject,
        chapter: null,
        mcqs: [],
      })
    }

    const chapterIndex = getChapterIndex(context.course, context.chapter.id)
    if (!canAccessChapterTest(req.user, context.subject, chapterIndex, req.query.testPart)) {
      return res.status(403).json({
        error: 'Please subscribe to access this test/past paper.',
        code: 'SUBSCRIPTION_REQUIRED',
        subject: context.subject,
      })
    }

    const allMcqs = sortMcqsByOriginalOrder(
      await MCQ.find(context.filter).sort({ createdAt: 1 }).lean(),
    )
    const selectedTestPart = teacherRoleNames.has(role) ? null : normalizeTestPart(req.query.testPart)
    const mcqs = sliceMcqsForVirtualTest(allMcqs, selectedTestPart)
    const safeMcqs = includeFull ? serializeMcqsMedia(mcqs) : stripCorrectOptions(mcqs)
    const responseChapter = selectedTestPart
      ? {
          ...context.chapter,
          originalName: context.chapter.name,
          name: `${context.chapter.name} - Test ${selectedTestPart}`,
          isVirtualTest: true,
          testPart: selectedTestPart,
          totalChapterMcqs: allMcqs.length,
        }
      : context.chapter

    res.status(200).json({
      success: true,
      subject: context.subject,
      courseId: context.course._id,
      chapter: responseChapter,
      topics: getChapterTopics(context.chapter),
      selectedTopic: context.topic,
      reviewQueue: getChapterReviewQueue(context.chapter)
        .filter((item) => {
          if (!req.query.topicId) return true
          return String(item.topicId || '') === String(req.query.topicId)
        })
        .sort(compareMcqOrder),
      count: safeMcqs.length,
      mcqs: safeMcqs,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== CREATE CHAPTER MCQ ====================
exports.createChapterMcq = async (req, res) => {
  try {
    const context = await buildChapterMcqFilter(
      req.params.subject,
      req.params.chapterId,
      true,
      req.body.topicId || null,
    )
    if (context.error) return res.status(400).json({ error: context.error })
    if (!context.course || !context.chapter)
      return res.status(404).json({ error: 'Chapter not found' })

    const chapterIndex = getChapterIndex(context.course, context.chapter.id)
    if (!canAccessChapterTest(req.user, context.subject, chapterIndex, req.query.testPart)) {
      return res.status(403).json({
        error: 'Please subscribe to access this test/past paper.',
        code: 'SUBSCRIPTION_REQUIRED',
        subject: context.subject,
      })
    }
    if (!canManageCourse(context.course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const {
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      difficulty,
      questionImageUrl: rawQuestionImageUrl,
      question_image_url: rawQuestionImageUrlAlt,
      questionImageAlt,
      question_image_alt: rawQuestionImageAlt,
      optionAImageUrl: rawOptionAImageUrl,
      option_a_image_url: rawOptionAImageUrlAlt,
      optionAImageAlt,
      option_a_image_alt: rawOptionAImageAlt,
      optionBImageUrl: rawOptionBImageUrl,
      option_b_image_url: rawOptionBImageUrlAlt,
      optionBImageAlt,
      option_b_image_alt: rawOptionBImageAlt,
      optionCImageUrl: rawOptionCImageUrl,
      option_c_image_url: rawOptionCImageUrlAlt,
      optionCImageAlt,
      option_c_image_alt: rawOptionCImageAlt,
      optionDImageUrl: rawOptionDImageUrl,
      option_d_image_url: rawOptionDImageUrlAlt,
      optionDImageAlt,
      option_d_image_alt: rawOptionDImageAlt,
      explanationImageUrl: rawExplanationImageUrl,
      explanation_image_url: rawExplanationImageUrlAlt,
      explanationImageAlt,
      explanation_image_alt: rawExplanationImageAlt,
    } = req.body
    const normalizedAnswer = String(correctAnswer || '')
      .trim()
      .toUpperCase()
    const questionMedia = extractImagesAndCleanText(question, [
      req.body.questionImages,
      req.body.questionImage,
      rawQuestionImageUrl,
      rawQuestionImageUrlAlt,
    ])
    const optionAMedia = extractImagesAndCleanText(optionA, [
      req.body.optionAImages,
      rawOptionAImageUrl,
      rawOptionAImageUrlAlt,
    ])
    const optionBMedia = extractImagesAndCleanText(optionB, [
      req.body.optionBImages,
      rawOptionBImageUrl,
      rawOptionBImageUrlAlt,
    ])
    const optionCMedia = extractImagesAndCleanText(optionC, [
      req.body.optionCImages,
      rawOptionCImageUrl,
      rawOptionCImageUrlAlt,
    ])
    const optionDMedia = extractImagesAndCleanText(optionD, [
      req.body.optionDImages,
      rawOptionDImageUrl,
      rawOptionDImageUrlAlt,
    ])
    const explanationMedia = extractImagesAndCleanText(explanation, [
      req.body.explanationImages,
      req.body.explanationImage,
      rawExplanationImageUrl,
      rawExplanationImageUrlAlt,
    ])

    const sanitizedQuestion = questionMedia.text
    const sanitizedOptionA = optionAMedia.text
    const sanitizedOptionB = optionBMedia.text
    const sanitizedOptionC = optionCMedia.text
    const sanitizedOptionD = optionDMedia.text
    const sanitizedExplanation = explanationMedia.text
    if (
      !sanitizedQuestion ||
      !sanitizedOptionA ||
      !sanitizedOptionB ||
      !sanitizedOptionC ||
      !sanitizedOptionD ||
      !['A', 'B', 'C', 'D'].includes(normalizedAnswer)
    ) {
      return res.status(400).json({
        error: 'Question, all options, and correct answer A-D are required',
      })
    }

    const options = normalizeOptionsFromLetters({
      optionA: sanitizedOptionA,
      optionAImages: optionAMedia.images,
      optionB: sanitizedOptionB,
      optionBImages: optionBMedia.images,
      optionC: sanitizedOptionC,
      optionCImages: optionCMedia.images,
      optionD: sanitizedOptionD,
      optionDImages: optionDMedia.images,
      correctAnswer: normalizedAnswer,
    })
    const mcq = await MCQ.create({
      courseId: context.course._id,
      topic: context.topic?.name || context.chapter.name,
      subject: context.subject,
      chapterId: context.chapter.id,
      chapterName: context.chapter.name,
      topicId: context.topic?.id || null,
      question: sanitizedQuestion,
      questionText: sanitizedQuestion,
      questionImages: questionMedia.images,
      options,
      optionA: options[0]?.text || '',
      optionAImages: options[0]?.images || [],
      optionB: options[1]?.text || '',
      optionBImages: options[1]?.images || [],
      optionC: options[2]?.text || '',
      optionCImages: options[2]?.images || [],
      optionD: options[3]?.text || '',
      optionDImages: options[3]?.images || [],
      explanation: sanitizedExplanation || null,
      explanationText: sanitizedExplanation,
      explanationImages: explanationMedia.images,
      difficulty: String(difficulty || 'medium').toLowerCase(),
      createdBy: req.user.id,
      isPublished: true,
      correctAnswer: normalizedAnswer,
      needsReview: false,
      hasDiagram: [
        sanitizedQuestion,
        sanitizedOptionA,
        sanitizedOptionB,
        sanitizedOptionC,
        sanitizedOptionD,
        sanitizedExplanation,
      ].some((value) => hasDiagram(value)) ||
        [questionMedia.images, optionAMedia.images, optionBMedia.images, optionCMedia.images, optionDMedia.images, explanationMedia.images].some((images) => images?.length),
      hasLatex: [
        sanitizedQuestion,
        sanitizedOptionA,
        sanitizedOptionB,
        sanitizedOptionC,
        sanitizedOptionD,
        sanitizedExplanation,
      ].some(hasLatex),
      reviewReason: null,
    })

    res
      .status(201)
      .json({ success: true, message: 'MCQ created successfully', mcq: serializeMcqMedia(mcq) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== CSV UPLOAD ====================
exports.uploadChapterMcqsCsv = async (req, res) => {
  try {
    const topicIdFromBody = req.body?.topicId || req.query?.topicId || null
    const context = await buildChapterMcqFilter(
      req.params.subject,
      req.params.chapterId,
      true,
      topicIdFromBody,
    )
    if (context.error) return res.status(400).json({ error: context.error })
    if (!context.course || !context.chapter)
      return res.status(404).json({ error: 'Chapter not found' })
    if (!canManageCourse(context.course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const csvText = req.file?.buffer
      ? req.file.buffer.toString('utf8')
      : String(req.body.csvText || '')
    if (!csvText.trim())
      return res.status(400).json({ error: 'CSV text is required' })

    const parsedRows = parse(csvText, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: false,
    })
    if (!parsedRows.length) {
      return res.status(400).json({ error: 'CSV file is empty' })
    }

    const headers = (parsedRows[0] || []).map((header) =>
      String(header || '')
        .trim()
        .toLowerCase(),
    )
    const required = [
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
    ]
    const missing = required.filter((header) => !headers.includes(header))
    if (missing.length) {
      return res
        .status(400)
        .json({ error: `Missing required CSV columns: ${missing.join(', ')}` })
    }

    const rows = parsedRows
      .slice(1)
      .map((row) => normalizeCsvRowToHeaders(row, headers))
      .map((row) =>
        Object.fromEntries(
          headers.map((header, columnIndex) => [
            header,
            row[columnIndex] ?? '',
          ]),
        ),
      )

    const importBatch = await ImportBatch.create({
      fileName: req.file?.originalname || req.body.fileName || 'CSV upload',
      subject: context.subject,
      courseId: context.course._id,
      chapterId: context.chapter.id,
      topicId: context.topic?.id || null,
      totalRows: rows.length,
      createdBy: req.user.id,
    })

    const skipped = []
    const reviewItems = []
    const docs = []
    const batchQuestions = new Set()
    const batchQuestionNumbers = new Set()
    const batchNumberQuestionKeys = new Set()
    const uploadedQuestionNumbers = new Set()

    const normalizedRows = rows.map((rawRow, index) => ({
      rawRow,
      rowNumber: index + 2,
      csvRowIndex: index + 1,
      row: Object.fromEntries(
        Object.entries(rawRow || {}).map(([key, value]) => [
          String(key).trim().toLowerCase(),
          value,
        ]),
      ),
    }))

    const explicitNumberRows = normalizedRows
      .map((entry) => ({
        ...entry,
        explicitQuestionNumber: getExplicitCsvQuestionNumber(entry.row),
      }))
      .filter((entry) => String(entry.explicitQuestionNumber || '').trim())
    const explicitNumericQuestionNumbers = explicitNumberRows
      .map((entry) => ({
        number: numericQuestionNumber(entry.explicitQuestionNumber),
        csvRowIndex: entry.csvRowIndex,
      }))
      .filter((entry) => entry.number !== null)
    const headerCountedQuestionNumbers =
      explicitNumericQuestionNumbers.length > 0 &&
      !explicitNumericQuestionNumbers.some((entry) => entry.number === 1) &&
      explicitNumericQuestionNumbers.every(
        (entry) => entry.number === entry.csvRowIndex + 1,
      )

    normalizedRows.forEach(({ rawRow, rowNumber, csvRowIndex, row }) => {
      const questionNumber = normalizeCsvQuestionNumber({
        explicitQuestionNumber: getExplicitCsvQuestionNumber(row),
        csvRowIndex,
        rowNumber,
        headerCountedQuestionNumbers,
      })
      const fallbackQuestionNumber = String(
        questionNumber ||
          csvRowIndex,
      ).trim()
      const question = normalizeCsvCell(getCsvValue(row, 'questionText', 'question_text', 'question'))
      const optionA = normalizeCsvCell(getCsvValue(row, 'option_a', 'optionA'))
      const optionB = normalizeCsvCell(getCsvValue(row, 'option_b', 'optionB'))
      const optionC = normalizeCsvCell(getCsvValue(row, 'option_c', 'optionC'))
      const optionD = normalizeCsvCell(getCsvValue(row, 'option_d', 'optionD'))
      const correctAnswer = normalizeCsvCorrectAnswer(getCsvValue(row, 'correct_answer', 'correctAnswer'))
      const explanation = normalizeCsvCell(getCsvValue(row, 'explanationText', 'explanation_text', 'explanation'))
      const questionImages = csvImageArray(row, 'questionImages', 'question_images', 'questionImage', 'question_image')
      const optionAImages = csvImageArray(row, 'optionAImages', 'option_a_images', 'optionAImage', 'option_a_image')
      const optionBImages = csvImageArray(row, 'optionBImages', 'option_b_images', 'optionBImage', 'option_b_image')
      const optionCImages = csvImageArray(row, 'optionCImages', 'option_c_images', 'optionCImage', 'option_c_image')
      const optionDImages = csvImageArray(row, 'optionDImages', 'option_d_images', 'optionDImage', 'option_d_image')
      const explanationImages = csvImageArray(row, 'explanationImages', 'explanation_images', 'explanationImage', 'explanation_image')
      const explicitNeedsReview =
        String(row.needs_review || '')
          .trim()
          .toLowerCase() === 'true'
      const reviewReasons = determineReviewReasons({
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation,
        explicitNeedsReview,
      })
      const duplicateKey = `${fallbackQuestionNumber}::${String(question).trim().toLowerCase()}`

      if (question && batchQuestions.has(question.toLowerCase())) {
        reviewReasons.push('Duplicate question inside this CSV')
      }
      if (fallbackQuestionNumber && batchQuestionNumbers.has(fallbackQuestionNumber)) {
        reviewReasons.push('Duplicate question number inside this CSV')
      }
      if (question && fallbackQuestionNumber && batchNumberQuestionKeys.has(duplicateKey)) {
        reviewReasons.push('Duplicate original question number and text inside this CSV')
      }

      uploadedQuestionNumbers.add(fallbackQuestionNumber)
      if (fallbackQuestionNumber) batchQuestionNumbers.add(fallbackQuestionNumber)

      if (reviewReasons.length > 0) {
        const reason = [...new Set(reviewReasons)].join('; ')
        const validationErrors = [...new Set(reviewReasons)]
        skipped.push({
          row: rowNumber,
          csvRowIndex,
          questionNumber: fallbackQuestionNumber,
          originalQuestionNumber: fallbackQuestionNumber,
          reason,
          validationErrors,
        })
        reviewItems.push(
          buildReviewQueueItem({
            rowNumber,
            csvRowIndex,
            questionNumber: fallbackQuestionNumber,
            importBatchId: importBatch._id,
            validationErrors,
            context,
            question,
            questionImages,
            optionA,
            optionAImages,
            optionB,
            optionBImages,
            optionC,
            optionCImages,
            optionD,
            optionDImages,
            correctAnswer,
            explanation,
            explanationImages,
            rawRow: headers.map((header) => row[header] ?? ''),
            reason,
          }),
        )
        return
      }

      batchQuestions.add(question.toLowerCase())
      batchNumberQuestionKeys.add(duplicateKey)
      docs.push(
        createMcqDocFromRow({
          context,
          question,
          questionImages,
          optionA,
          optionAImages,
          optionB,
          optionBImages,
          optionC,
          optionCImages,
          optionD,
          optionDImages,
          correctAnswer,
          explanation,
          explanationImages,
          questionNumber: fallbackQuestionNumber,
          originalQuestionNumber: fallbackQuestionNumber,
          csvRowIndex,
          importBatchId: importBatch._id,
          importStatus: 'imported',
          validationErrors: [],
          createdBy: req.user.id,
          reviewReason: null,
        }),
      )
    })

    const uploadedNumbers = [...uploadedQuestionNumbers].filter(Boolean)
    if (uploadedNumbers.length) {
      const numberFilter = {
        $or: [
          { originalQuestionNumber: { $in: uploadedNumbers } },
          { questionNumber: { $in: uploadedNumbers } },
        ],
      }
      const replaceFilter = {
        courseId: context.course._id,
        chapterId: context.chapter.id,
      }
      if (context.topic?.id) {
        replaceFilter.topicId = context.topic.id
        replaceFilter.$or = numberFilter.$or
      } else {
        replaceFilter.$and = [
          { $or: [{ topicId: null }, { topicId: { $exists: false } }] },
          numberFilter,
        ]
      }
      // CSV upload is source-of-truth for these question-number slots.
      // If row 12 goes to review, old main MCQ 12 must be removed.
      await MCQ.deleteMany(replaceFilter)
    }

    if (uploadedNumbers.length || reviewItems.length) {
      const courseForReviewQueue = await getSubjectCourseFull(context.subject)
      const chapterForReviewQueue = getChapter(
        courseForReviewQueue,
        context.chapter.id,
      )
      chapterForReviewQueue.reviewQueue = getChapterReviewQueue(
        chapterForReviewQueue,
      ).filter((item) => {
        const itemNumber = String(item.originalQuestionNumber || item.questionNumber || '').trim()
        if (!uploadedQuestionNumbers.has(itemNumber)) return true
        if (context.topic?.id) return String(item.topicId || '') !== String(context.topic.id)
        return !!item.topicId
      })
      chapterForReviewQueue.reviewQueue.push(...reviewItems)
      await courseForReviewQueue.save()
    }

    const inserted = docs.length
      ? await MCQ.insertMany(docs, { ordered: false })
      : []
    importBatch.importedCount = inserted.length
    importBatch.reviewCount = reviewItems.length
    importBatch.rejectedCount = 0
    await importBatch.save()
    const reviewQuestionNumbers = reviewItems.map(
      (item) => item.originalQuestionNumber || item.questionNumber || item.csvRowIndex || item.row,
    )
    res.status(200).json({
      success: true,
      importBatchId: importBatch._id,
      totalRows: rows.length,
      importedRows: inserted.length,
      reviewRows: reviewItems.length,
      reviewQuestionNumbers,
      imported: inserted.length,
      review_queue: reviewItems.length,
      message: `Imported: ${inserted.length}. Needs review: ${reviewItems.length}.`,
      uploaded: inserted.length,
      skippedCount: skipped.length,
      queuedForReview: reviewItems.length,
      skipped,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DELETE CSV REVIEW ITEM ====================
exports.deleteCsvReviewItem = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const existingQueue = getChapterReviewQueue(chapter)
    const nextQueue = existingQueue.filter(
      (item) => item.id !== req.params.itemId,
    )
    if (nextQueue.length === existingQueue.length) {
      return res.status(404).json({ error: 'Review item not found' })
    }

    chapter.reviewQueue = nextQueue
    await course.save()

    res
      .status(200)
      .json({ success: true, message: 'Review item removed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE CSV REVIEW ITEM ====================
exports.updateCsvReviewItem = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    chapter.reviewQueue = getChapterReviewQueue(chapter)
    const item = chapter.reviewQueue.find(
      (entry) => entry.id === req.params.itemId,
    )
    if (!item) return res.status(404).json({ error: 'Review item not found' })

    item.question = normalizeCsvCell(req.body.question)
    item.optionA = normalizeCsvCell(req.body.optionA)
    item.optionB = normalizeCsvCell(req.body.optionB)
    item.optionC = normalizeCsvCell(req.body.optionC)
    item.optionD = normalizeCsvCell(req.body.optionD)
    item.correctAnswer = String(
      normalizeCsvCorrectAnswer(req.body.correctAnswer),
    ).toUpperCase()
    item.explanation = normalizeCsvCell(req.body.explanation)

    const reviewReasons = determineReviewReasons({
      question: item.question,
      optionA: item.optionA,
      optionB: item.optionB,
      optionC: item.optionC,
      optionD: item.optionD,
      correctAnswer: String(item.correctAnswer || '').toLowerCase(),
      explanation: item.explanation,
      explicitNeedsReview: false,
    })
    item.reason = String(
      req.body.reason ||
        reviewReasons.join('; ') ||
        item.reason ||
        'Needs manual review',
    ).trim()
    item.validationErrors = reviewReasons
    item.importStatus = reviewReasons.length ? 'review' : 'pending'

    await course.save()

    res.status(200).json({
      success: true,
      message: 'Review item updated successfully',
      item,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET CSV REVIEW QUEUE ====================
exports.getCsvReviewQueue = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const reviewQueue = getChapterReviewQueue(chapter)
      .filter((item) => {
        if (!req.query.topicId) return true
        return String(item.topicId || '') === String(req.query.topicId)
      })
      .sort(compareMcqOrder)

    res.status(200).json({
      success: true,
      chapterId: chapter.id,
      reviewQueue,
      count: reviewQueue.length,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== APPROVE CSV REVIEW ITEM ====================
exports.approveCsvReviewItem = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject)
    if (!subject) return res.status(400).json({ error: 'Invalid subject' })

    const course = await getSubjectCourseFull(subject)
    if (!course)
      return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res
        .status(403)
        .json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    chapter.reviewQueue = getChapterReviewQueue(chapter)
    const item = chapter.reviewQueue.find(
      (entry) => entry.id === req.params.itemId,
    )
    if (!item) return res.status(404).json({ error: 'Review item not found' })

    const question = normalizeCsvCell(req.body.question || item.question)
    const optionA = normalizeCsvCell(req.body.optionA || item.optionA)
    const optionB = normalizeCsvCell(req.body.optionB || item.optionB)
    const optionC = normalizeCsvCell(req.body.optionC || item.optionC)
    const optionD = normalizeCsvCell(req.body.optionD || item.optionD)
    const correctAnswer = normalizeCsvCorrectAnswer(
      req.body.correctAnswer || item.correctAnswer,
    )
    const explanation = normalizeCsvCell(
      req.body.explanation || item.explanation,
    )
    const reviewReasons = determineReviewReasons({
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      explicitNeedsReview: false,
    })
    if (reviewReasons.length) {
      return res.status(400).json({ error: reviewReasons.join('; ') })
    }

    const topic = item.topicId ? getTopic(chapter, item.topicId) : null
    const approvalContext = {
      course,
      chapter,
      topic,
      subject,
    }
    const approvedQuestionNumber = String(
      item.originalQuestionNumber || item.questionNumber || item.csvRowIndex || item.row || '',
    ).trim()
    if (approvedQuestionNumber) {
      const replaceFilter = {
        courseId: course._id,
        chapterId: chapter.id,
      }
      if (topic?.id) {
        replaceFilter.topicId = topic.id
        replaceFilter.$or = [
          { originalQuestionNumber: approvedQuestionNumber },
          { questionNumber: approvedQuestionNumber },
        ]
      } else {
        replaceFilter.$and = [
          { $or: [{ topicId: null }, { topicId: { $exists: false } }] },
          {
            $or: [
              { originalQuestionNumber: approvedQuestionNumber },
              { questionNumber: approvedQuestionNumber },
            ],
          },
        ]
      }
      await MCQ.deleteMany(replaceFilter)
    }
    const mcq = await MCQ.create(
      createMcqDocFromRow({
        context: approvalContext,
        question,
        questionImages: item.questionImages || [],
        optionA,
        optionAImages: item.optionAImages || [],
        optionB,
        optionBImages: item.optionBImages || [],
        optionC,
        optionCImages: item.optionCImages || [],
        optionD,
        optionDImages: item.optionDImages || [],
        correctAnswer,
        explanation,
        explanationImages: item.explanationImages || [],
        questionNumber: approvedQuestionNumber || item.questionNumber || item.csvRowIndex || item.row,
        originalQuestionNumber: approvedQuestionNumber || item.originalQuestionNumber || item.csvRowIndex || item.row,
        csvRowIndex: item.csvRowIndex || item.row || null,
        importBatchId: item.importBatchId || null,
        importStatus: 'fixed',
        validationErrors: [],
        createdBy: req.user.id,
        reviewReason: item.reason || null,
      }),
    )

    chapter.reviewQueue = chapter.reviewQueue.filter(
      (entry) => entry.id !== item.id,
    )
    await course.save()

    res.status(200).json({
      success: true,
      message: 'Review item approved and added to MCQs',
      mcq,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== SUBMIT CHAPTER ATTEMPT ====================
exports.submitChapterAttempt = async (req, res) => {
  try {
    const context = await buildChapterMcqFilter(
      req.params.subject,
      req.params.chapterId,
      false,
      req.query.topicId || null,
    )
    if (context.error) return res.status(400).json({ error: context.error })
    if (!context.course || !context.chapter)
      return res.status(404).json({ error: 'Chapter not found' })

    const chapterIndex = getChapterIndex(context.course, context.chapter.id)
    if (!canAccessChapterTest(req.user, context.subject, chapterIndex, req.query.testPart)) {
      return res.status(403).json({
        error: 'Please subscribe to access this test/past paper.',
        code: 'SUBSCRIPTION_REQUIRED',
        subject: context.subject,
      })
    }

    const answers = req.body.answers || {}
    const allMcqs = sortMcqsByOriginalOrder(
      await MCQ.find(context.filter).sort({ createdAt: 1 }).lean(),
    )
    const selectedTestPart = normalizeTestPart(req.query.testPart)
    const mcqs = sliceMcqsForVirtualTest(allMcqs, selectedTestPart)
    if (!mcqs.length)
      return res.status(404).json({ error: 'No MCQs found for this chapter' })

    const detailed = mcqs.map((rawMcq) => {
      const mcq = serializeMcqMedia(rawMcq)
      const selectedIndexRaw = answers[String(mcq._id)]
      const selectedIndex =
        selectedIndexRaw === null || selectedIndexRaw === undefined
          ? -1
          : Number(selectedIndexRaw)
      const correctIndex = mcq.options.findIndex((option) => option.isCorrect)
      const skipped = selectedIndex < 0
      const isCorrect = !skipped && selectedIndex === correctIndex
      return {
        mcqId: mcq._id,
        questionNumber: mcq.questionNumber || null,
        originalQuestionNumber: mcq.originalQuestionNumber || mcq.questionNumber || null,
        csvRowIndex: mcq.csvRowIndex || null,
        question: mcq.questionText || mcq.question,
        questionText: mcq.questionText || mcq.question,
        questionImages: mcq.questionImages || [],
        options: mcq.options,
        selectedIndex,
        correctIndex,
        skipped,
        isCorrect,
        explanation: mcq.explanationText || mcq.explanation || '',
        explanationText: mcq.explanationText || mcq.explanation || '',
        explanationImages: mcq.explanationImages || [],
      }
    })

    const correct = detailed.filter((item) => item.isCorrect).length
    const skipped = detailed.filter((item) => item.skipped).length
    const wrong = detailed.length - correct - skipped
    const percentage = Math.round((correct / detailed.length) * 100)
    const startedAt = req.body.startedAt ? new Date(req.body.startedAt) : new Date()
    const responseChapter = selectedTestPart
      ? {
          ...context.chapter,
          originalName: context.chapter.name,
          name: `${context.chapter.name} - Test ${selectedTestPart}`,
          isVirtualTest: true,
          testPart: selectedTestPart,
          totalChapterMcqs: allMcqs.length,
        }
      : context.chapter
    const attemptChapterName = responseChapter.name || context.chapter.name

    const testSession = await TestSession.create({
      studentId: req.user.id,
      courseId: context.course._id,
      topic: context.topic?.name || attemptChapterName,
      topicId: context.topic?.id || null,
      subject: context.subject,
      chapterId: context.chapter.id,
      chapterName: attemptChapterName,
      totalQuestions: detailed.length,
      score: correct,
      finalScore: correct,
      percentage,
      timeLimitSeconds: req.body.timeLimitSeconds || detailed.length * 50,
      timeSpentSeconds: req.body.timeSpentSeconds || null,
      startedAt: Number.isNaN(startedAt.getTime()) ? new Date() : startedAt,
      submittedAt: new Date(),
      answers: detailed
        .map((item) => ({
          mcqId: item.mcqId,
          selectedIndex: item.selectedIndex,
          correctIndex: item.correctIndex,
          isCorrect: item.isCorrect,
        })),
    })

    res.status(200).json({
      success: true,
      testSessionId: testSession._id,
      subject: context.subject,
      chapter: responseChapter,
      selectedTopic: context.topic,
      totalQuestions: detailed.length,
      correct,
      wrong,
      skipped,
      score: correct,
      percentage,
      detailed,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}








