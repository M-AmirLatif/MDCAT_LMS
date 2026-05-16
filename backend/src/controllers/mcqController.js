const MCQ = require('../models/MCQ')
const Course = require('../models/Course')
const TestSession = require('../models/TestSession')

const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English']
const SUBJECT_SLUGS = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  english: 'English',
}

const normalizeSubject = (value) => SUBJECT_SLUGS[String(value || '').trim().toLowerCase()] || null
const slugifyChapter = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const teacherRoleNames = new Set(['teacher', 'admin'])

const canManageCourse = (course, user) => {
  const roleName = user?.role?.name
  return teacherRoleNames.has(roleName)
}

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
  (course.chapters || []).find((chapter) => String(chapter.id) === String(chapterId))

const normalizeOptionsFromLetters = ({ optionA, optionB, optionC, optionD, correctAnswer }) => {
  const letters = ['A', 'B', 'C', 'D']
  const values = [optionA, optionB, optionC, optionD]
  const normalizedAnswer = String(correctAnswer || '').trim().toUpperCase()
  return values.map((text, index) => ({
    text: String(text || '').trim(),
    isCorrect: letters[index] === normalizedAnswer,
  }))
}

const parseCsv = (csvText) => {
  const rows = []
  let current = ''
  let row = []
  let quoted = false

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i]
    const next = csvText[i + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(current)
      current = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(current)
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
      row = []
      current = ''
    } else {
      current += char
    }
  }

  row.push(current)
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
  return rows
}

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
      question,
      options,
      explanation,
      difficulty,
      year,
      isPastPaper,
      isPublished,
    } = req.body

    if (!courseId || !topic || !question || !options) {
      return res
        .status(400)
        .json({ error: 'Please provide all required fields' })
    }

    if (!hasCorrectOption(options)) {
      return res
        .status(400)
        .json({ error: 'At least one option must be correct' })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    if (
      course.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to add MCQs to this course' })
    }

    const mcq = await MCQ.create({
      courseId,
      topic,
      question,
      options,
      explanation: explanation || null,
      subject: subject || course.category,
      chapterId: chapterId || null,
      chapterName: chapterName || topic,
      difficulty: difficulty || 'medium',
      year: year || null,
      isPastPaper: isPastPaper || false,
      createdBy: req.user.id,
      isPublished: typeof isPublished === 'boolean' ? isPublished : false,
      correctAnswer:
        ['A', 'B', 'C', 'D'][options.findIndex((option) => option.isCorrect)] || null,
    })

    res.status(201).json({
      success: true,
      message: 'MCQ created successfully',
      mcq,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const stripCorrectOptions = (mcqs) => {
  return mcqs.map((mcq) => {
    const { correctAnswer, explanation, ...safeMcq } = mcq
    return {
      ...safeMcq,
      options: mcq.options?.map((opt) => ({ text: opt.text })) || [],
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

    const mcqs = await query.sort({ createdAt: -1 })
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
    const filter = { courseId: req.params.courseId }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const skip = (page - 1) * limit

    const [mcqs, total] = await Promise.all([
      MCQ.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MCQ.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      count: mcqs.length,
      mcqs,
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
      question,
      options,
      explanation,
      difficulty,
      year,
      isPastPaper,
      isPublished,
    } = req.body

    let mcq = await MCQ.findById(req.params.mcqId)

    if (!mcq) {
      return res.status(404).json({ error: 'MCQ not found' })
    }

    if (
      mcq.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this MCQ' })
    }

    if (options && !hasCorrectOption(options)) {
      return res
        .status(400)
        .json({ error: 'At least one option must be correct' })
    }

    mcq = await MCQ.findByIdAndUpdate(
      req.params.mcqId,
      {
        topic,
        subject,
        chapterId,
        chapterName,
        question,
        options,
        explanation,
        difficulty,
        year,
        isPastPaper,
        isPublished,
        correctAnswer: options ? ['A', 'B', 'C', 'D'][options.findIndex((option) => option.isCorrect)] || null : mcq.correctAnswer,
      },
      { new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      message: 'MCQ updated successfully',
      mcq,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DELETE MCQ ====================
exports.deleteMcq = async (req, res) => {
  try {
    const mcq = await MCQ.findById(req.params.mcqId)

    if (!mcq) {
      return res.status(404).json({ error: 'MCQ not found' })
    }

    if (
      mcq.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin'
    ) {
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
    const courses = await Course.find({ category: { $in: SUBJECTS } })
      .select('_id category chapters')
      .lean()
    const courseBySubject = new Map(courses.map((course) => [course.category, course]))
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
    const mcqCountBySubject = new Map(mcqCounts.map((item) => [item._id, item.totalMcqs]))

    const subjects = SUBJECTS.map((subject) => {
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

    const course = await getSubjectCourse(subject)
    if (!course) {
      return res.status(200).json({ success: true, subject, courseId: null, chapters: [] })
    }

    const counts = await MCQ.aggregate([
      { $match: { courseId: course._id, subject } },
      { $group: { _id: '$chapterId', totalMcqs: { $sum: 1 } } },
    ])
    const countByChapter = new Map(counts.map((item) => [item._id, item.totalMcqs]))

    const chapters = (course.chapters || []).map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      description: chapter.description || '',
      mcqCount: countByChapter.get(chapter.id) || 0,
    }))

    res.status(200).json({ success: true, subject, courseId: course._id, chapters })
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
    if (!name) return res.status(400).json({ error: 'Chapter name is required' })

    const course = await ensureSubjectCourse(subject, req.user)
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ error: 'Not authorized to manage this subject' })
    }

    const baseId = slugifyChapter(name)
    const existingIds = new Set((course.chapters || []).map((chapter) => chapter.id))
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
      chapter: { id: chapterId, name, description, mcqCount: 0 },
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
    if (!course) return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const name = String(req.body.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Chapter name is required' })

    chapter.name = name
    chapter.description = String(req.body.description || '').trim()
    await course.save()

    await MCQ.updateMany(
      { courseId: course._id, chapterId: chapter.id },
      { chapterName: chapter.name, topic: chapter.name },
    )

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      chapter: { id: chapter.id, name: chapter.name, description: chapter.description || '' },
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
    if (!course) return res.status(404).json({ error: 'Subject course not found' })
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ error: 'Not authorized to manage this subject' })
    }

    const chapter = getChapter(course, req.params.chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    const mcqCount = await MCQ.countDocuments({ courseId: course._id, chapterId: chapter.id })
    if (mcqCount > 0) {
      return res.status(400).json({ error: 'Cannot delete chapter while MCQs exist inside it' })
    }

    course.chapters = course.chapters.filter((item) => item.id !== chapter.id)
    await course.save()

    res.status(200).json({ success: true, message: 'Chapter deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const buildChapterMcqFilter = async (subjectParam, chapterId, includeUnpublished = false) => {
  const subject = normalizeSubject(subjectParam)
  if (!subject) return { error: 'Invalid subject' }

  const course = await getSubjectCourse(subject)
  if (!course) return { subject, course: null, chapter: null, filter: null }

  const chapter = getChapter(course, chapterId)
  if (!chapter) return { subject, course, chapter: null, filter: null }

  const filter = { courseId: course._id, subject, chapterId: chapter.id }
  if (!includeUnpublished) filter.isPublished = true
  return { subject, course, chapter, filter }
}

// ==================== MCQS BY CHAPTER ====================
exports.getMcqsByChapter = async (req, res) => {
  try {
    const role = req.user?.role?.name
    const includeFull = teacherRoleNames.has(role)
    const context = await buildChapterMcqFilter(req.params.subject, req.params.chapterId, includeFull)
    if (context.error) return res.status(400).json({ error: context.error })
    if (!context.course || !context.chapter) {
      return res.status(200).json({ success: true, subject: context.subject, chapter: null, mcqs: [] })
    }

    const mcqs = await MCQ.find(context.filter).sort({ createdAt: 1 }).lean()
    const safeMcqs = includeFull ? mcqs : stripCorrectOptions(mcqs)

    res.status(200).json({
      success: true,
      subject: context.subject,
      courseId: context.course._id,
      chapter: context.chapter,
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
    const context = await buildChapterMcqFilter(req.params.subject, req.params.chapterId, true)
    if (context.error) return res.status(400).json({ error: context.error })
    if (!context.course || !context.chapter) return res.status(404).json({ error: 'Chapter not found' })
    if (!canManageCourse(context.course, req.user)) {
      return res.status(403).json({ error: 'Not authorized to manage this subject' })
    }

    const { question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty } = req.body
    const normalizedAnswer = String(correctAnswer || '').trim().toUpperCase()
    if (!question || !optionA || !optionB || !optionC || !optionD || !['A', 'B', 'C', 'D'].includes(normalizedAnswer)) {
      return res.status(400).json({ error: 'Question, all options, and correct answer A-D are required' })
    }

    const options = normalizeOptionsFromLetters({ optionA, optionB, optionC, optionD, correctAnswer: normalizedAnswer })
    const mcq = await MCQ.create({
      courseId: context.course._id,
      topic: context.chapter.name,
      subject: context.subject,
      chapterId: context.chapter.id,
      chapterName: context.chapter.name,
      question: String(question).trim(),
      options,
      explanation: explanation || null,
      difficulty: String(difficulty || 'medium').toLowerCase(),
      createdBy: req.user.id,
      isPublished: true,
      correctAnswer: normalizedAnswer,
    })

    res.status(201).json({ success: true, message: 'MCQ created successfully', mcq })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== CSV UPLOAD ====================
exports.uploadChapterMcqsCsv = async (req, res) => {
  try {
    const context = await buildChapterMcqFilter(req.params.subject, req.params.chapterId, true)
    if (context.error) return res.status(400).json({ error: context.error })
    if (!context.course || !context.chapter) return res.status(404).json({ error: 'Chapter not found' })
    if (!canManageCourse(context.course, req.user)) {
      return res.status(403).json({ error: 'Not authorized to manage this subject' })
    }

    const csvText = String(req.body.csvText || '')
    if (!csvText.trim()) return res.status(400).json({ error: 'CSV text is required' })

    const rows = parseCsv(csvText)
    const headers = (rows.shift() || []).map((header) => String(header).trim().toLowerCase())
    const required = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']
    const missing = required.filter((header) => !headers.includes(header))
    if (missing.length) {
      return res.status(400).json({ error: `Missing required CSV columns: ${missing.join(', ')}` })
    }

    const indexOf = (name) => headers.indexOf(name)
    const skipped = []
    const docs = []
    const existingQuestions = new Set(
      (await MCQ.find({ courseId: context.course._id, chapterId: context.chapter.id }).select('question').lean())
        .map((item) => item.question.trim().toLowerCase()),
    )

    rows.forEach((row, index) => {
      const rowNumber = index + 2
      const question = String(row[indexOf('question')] || '').trim()
      const optionA = String(row[indexOf('option_a')] || '').trim()
      const optionB = String(row[indexOf('option_b')] || '').trim()
      const optionC = String(row[indexOf('option_c')] || '').trim()
      const optionD = String(row[indexOf('option_d')] || '').trim()
      const correctAnswer = String(row[indexOf('correct_answer')] || '').trim().toUpperCase()
      const explanation = String(row[indexOf('explanation')] || '').trim()

      if (!question || !optionA || !optionB || !optionC || !optionD) {
        skipped.push({ row: rowNumber, reason: 'Missing question or option field' })
        return
      }
      if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        skipped.push({ row: rowNumber, reason: 'correct_answer must be A, B, C, or D' })
        return
      }
      if (existingQuestions.has(question.toLowerCase())) {
        skipped.push({ row: rowNumber, reason: 'Duplicate question skipped' })
        return
      }

      existingQuestions.add(question.toLowerCase())
      docs.push({
        courseId: context.course._id,
        topic: context.chapter.name,
        subject: context.subject,
        chapterId: context.chapter.id,
        chapterName: context.chapter.name,
        question,
        options: normalizeOptionsFromLetters({ optionA, optionB, optionC, optionD, correctAnswer }),
        explanation: explanation || null,
        difficulty: 'medium',
        createdBy: req.user.id,
        isPublished: true,
        correctAnswer,
      })
    })

    const inserted = docs.length ? await MCQ.insertMany(docs) : []
    res.status(200).json({
      success: true,
      message: `${inserted.length} MCQs uploaded successfully, ${skipped.length} rows skipped`,
      uploaded: inserted.length,
      skippedCount: skipped.length,
      skipped,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== SUBMIT CHAPTER ATTEMPT ====================
exports.submitChapterAttempt = async (req, res) => {
  try {
    const context = await buildChapterMcqFilter(req.params.subject, req.params.chapterId, false)
    if (context.error) return res.status(400).json({ error: context.error })
    if (!context.course || !context.chapter) return res.status(404).json({ error: 'Chapter not found' })

    const answers = req.body.answers || {}
    const mcqs = await MCQ.find(context.filter).sort({ createdAt: 1 }).lean()
    if (!mcqs.length) return res.status(404).json({ error: 'No MCQs found for this chapter' })

    const detailed = mcqs.map((mcq) => {
      const selectedIndexRaw = answers[String(mcq._id)]
      const selectedIndex = selectedIndexRaw === null || selectedIndexRaw === undefined ? -1 : Number(selectedIndexRaw)
      const correctIndex = mcq.options.findIndex((option) => option.isCorrect)
      const skipped = selectedIndex < 0
      const isCorrect = !skipped && selectedIndex === correctIndex
      return {
        mcqId: mcq._id,
        question: mcq.question,
        options: mcq.options,
        selectedIndex,
        correctIndex,
        skipped,
        isCorrect,
        explanation: mcq.explanation || '',
      }
    })

    const correct = detailed.filter((item) => item.isCorrect).length
    const skipped = detailed.filter((item) => item.skipped).length
    const wrong = detailed.length - correct - skipped
    const percentage = Math.round((correct / detailed.length) * 100)

    const testSession = await TestSession.create({
      studentId: req.user.id,
      courseId: context.course._id,
      topic: context.chapter.name,
      subject: context.subject,
      chapterId: context.chapter.id,
      chapterName: context.chapter.name,
      totalQuestions: detailed.length,
      score: correct,
      finalScore: correct,
      percentage,
      timeLimitSeconds: req.body.timeLimitSeconds || detailed.length * 50,
      timeSpentSeconds: req.body.timeSpentSeconds || null,
      submittedAt: new Date(),
      answers: detailed
        .filter((item) => !item.skipped)
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
      chapter: context.chapter,
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
