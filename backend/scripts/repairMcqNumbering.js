require('dotenv').config()

const mongoose = require('mongoose')
const MCQ = require('../src/models/MCQ')
const Course = require('../src/models/Course')

const args = process.argv.slice(2)

const getArg = (name) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : null
}

const hasFlag = (name) => args.includes(`--${name}`)

const numericQuestionNumber = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const numeric = Number(raw)
  return Number.isFinite(numeric) ? numeric : null
}

const compareMcqOrder = (a, b) => {
  const aNumber = numericQuestionNumber(a.originalQuestionNumber ?? a.questionNumber)
  const bNumber = numericQuestionNumber(b.originalQuestionNumber ?? b.questionNumber)
  if (aNumber !== null && bNumber !== null && aNumber !== bNumber) return aNumber - bNumber
  if (aNumber !== null && bNumber === null) return -1
  if (aNumber === null && bNumber !== null) return 1

  const aRow = Number(a.csvRowIndex)
  const bRow = Number(b.csvRowIndex)
  if (Number.isFinite(aRow) && Number.isFinite(bRow) && aRow !== bRow) return aRow - bRow
  if (Number.isFinite(aRow) && !Number.isFinite(bRow)) return -1
  if (!Number.isFinite(aRow) && Number.isFinite(bRow)) return 1

  return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
}

const isHeaderCountedSequence = (items) => {
  if (!items.length) return false
  return items.every((item, index) => {
    const number = numericQuestionNumber(item.originalQuestionNumber ?? item.questionNumber)
    return number === index + 2
  })
}

const groupKeyForMcq = (mcq) =>
  [
    String(mcq.courseId || ''),
    String(mcq.chapterId || ''),
    String(mcq.topicId || ''),
  ].join('::')

const repairMcqGroup = async ({ items, write }) => {
  const sorted = [...items].sort(compareMcqOrder)
  if (!isHeaderCountedSequence(sorted)) return { matched: false, updated: 0 }

  if (!write) return { matched: true, updated: sorted.length }

  await Promise.all(
    sorted.map((mcq, index) => {
      const nextNumber = String(index + 1)
      return MCQ.updateOne(
        { _id: mcq._id },
        {
          $set: {
            questionNumber: nextNumber,
            originalQuestionNumber: nextNumber,
            originalQuestionNumberSort: index + 1,
            csvRowIndex: index + 1,
          },
        },
      )
    }),
  )

  return { matched: true, updated: sorted.length }
}

const repairReviewQueue = async ({ course, write }) => {
  let updated = 0
  let matched = 0
  let changed = false

  for (const chapter of course.chapters || []) {
    const queue = Array.isArray(chapter.reviewQueue) ? chapter.reviewQueue : []
    if (!queue.length) continue

    const topicGroups = new Map()
    for (const item of queue) {
      const key = String(item.topicId || '')
      if (!topicGroups.has(key)) topicGroups.set(key, [])
      topicGroups.get(key).push(item)
    }

    for (const items of topicGroups.values()) {
      const sorted = [...items].sort(compareMcqOrder)
      if (!isHeaderCountedSequence(sorted)) continue

      matched += 1
      updated += sorted.length
      if (!write) continue

      sorted.forEach((item, index) => {
        const nextNumber = String(index + 1)
        item.questionNumber = nextNumber
        item.originalQuestionNumber = nextNumber
        item.originalQuestionNumberSort = index + 1
        item.csvRowIndex = index + 1
      })
      changed = true
    }
  }

  if (changed) await course.save()
  return { matched, updated }
}

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!uri) throw new Error('Missing MONGO_URI/MONGODB_URI in backend/.env')

  const write = hasFlag('write')
  const subject = getArg('subject')
  const chapterId = getArg('chapter-id')
  const topicId = getArg('topic-id')

  await mongoose.connect(uri)

  const filter = {}
  if (subject) filter.subject = new RegExp(`^${subject}$`, 'i')
  if (chapterId) filter.chapterId = chapterId
  if (topicId) filter.topicId = topicId

  const mcqs = await MCQ.find(filter)
    .select('_id courseId subject chapterId topicId questionNumber originalQuestionNumber csvRowIndex createdAt')
    .lean()

  const groups = new Map()
  for (const mcq of mcqs) {
    const key = groupKeyForMcq(mcq)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(mcq)
  }

  let matchedGroups = 0
  let updatedMcqs = 0
  for (const items of groups.values()) {
    const result = await repairMcqGroup({ items, write })
    if (result.matched) matchedGroups += 1
    updatedMcqs += result.updated
  }

  const courseFilter = subject ? { category: new RegExp(`^${subject}$`, 'i') } : {}
  const courses = await Course.find(courseFilter)
  let matchedReviewGroups = 0
  let updatedReviewItems = 0
  for (const course of courses) {
    const result = await repairReviewQueue({ course, write })
    matchedReviewGroups += result.matched
    updatedReviewItems += result.updated
  }

  console.log(write ? 'Applied numbering repair.' : 'Dry run only. Add --write to apply changes.')
  console.log(`MCQ groups matched: ${matchedGroups}`)
  console.log(`MCQs ${write ? 'updated' : 'that would update'}: ${updatedMcqs}`)
  console.log(`Review queue groups matched: ${matchedReviewGroups}`)
  console.log(`Review queue items ${write ? 'updated' : 'that would update'}: ${updatedReviewItems}`)

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error.message)
  try {
    await mongoose.disconnect()
  } catch {
    // ignore
  }
  process.exit(1)
})
