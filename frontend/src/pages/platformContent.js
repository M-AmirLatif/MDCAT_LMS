import mdcatData from '../data/mdcatData.json'

export const SUBJECT_STYLES = {
  Biology: { className: 'card-biology', banner: 'linear-gradient(135deg, #1db884 0%, #34d49a 100%)', progress: 'var(--grad-teal)', accent: 'var(--teal)' },
  Chemistry: { className: 'card-chemistry', banner: 'linear-gradient(135deg, #6c47ff 0%, #1db884 100%)', progress: 'linear-gradient(135deg, #6C47FF 0%, #1DB884 100%)', accent: 'var(--purple)' },
  Physics: { className: 'card-physics', banner: 'linear-gradient(135deg, #4a90e2 0%, #73b1ff 100%)', progress: 'linear-gradient(135deg, #4A90E2 0%, #73B1FF 100%)', accent: 'var(--indigo)' },
  English: { className: 'card-english', banner: 'linear-gradient(135deg, #f59e0b 0%, #ffb648 100%)', progress: 'linear-gradient(135deg, #F59E0B 0%, #FFB648 100%)', accent: 'var(--amber-dark)' },
}

export const mdcatSubjects = mdcatData.subjects.map((subject) => ({
  ...subject,
  chapters: [],
  totalChapters: 0,
  totalMcqs: 0,
  attemptedMcqs: 0,
  accuracy: 0,
  theme: subject.name,
}))

export const mdcatChapters = []
export const practiceAttempts = []
export const performanceTrend = []
export const studentNotifications = []
export const liveClasses = []
export const recordings = []
export const teacherStudents = []
export const teacherAssignments = []
export const adminStudents = []
export const adminTeachers = []
export const adminTransactions = []
export const superAdminLogs = []

export const teacherMcqSummary = mdcatSubjects.map((subject) => ({
  subject: subject.name,
  chapters: 0,
  mcqs: 0,
  uploadedBy: 'No uploads yet',
}))

export const permissionMatrix = [
  ['Subjects', 'View', 'Edit Own', 'Manage', 'Manage'],
  ['Chapters', 'View', 'Manage', 'Manage', 'Manage'],
  ['MCQs', 'Attempt', 'Create/Edit', 'Moderate', 'Moderate'],
  ['Analytics', 'View Own', 'View Class', 'View Global', 'View Global'],
  ['Users', 'None', 'None', 'Manage', 'Manage'],
]

export function getSubjectById(subjectId) {
  return mdcatSubjects.find((subject) => subject.id === subjectId)
}

export function getChaptersBySubject(subjectId) {
  return mdcatChapters.filter((chapter) => chapter.subjectId === subjectId)
}

export function getChapterById(subjectId, chapterId) {
  return mdcatChapters.find((chapter) => chapter.subjectId === subjectId && chapter.id === chapterId)
}

export function getMcqsByChapter() {
  return []
}

export function getPerformanceSummary() {
  const totalAttempted = mdcatSubjects.reduce((sum, subject) => sum + subject.attemptedMcqs, 0)
  const totalMcqs = mdcatSubjects.reduce((sum, subject) => sum + subject.totalMcqs, 0)
  const attemptedSubjects = mdcatSubjects.filter((subject) => subject.attemptedMcqs > 0)
  const overallAccuracy = attemptedSubjects.length
    ? Math.round(attemptedSubjects.reduce((sum, subject) => sum + subject.accuracy, 0) / attemptedSubjects.length)
    : 0
  const sorted = [...attemptedSubjects].sort((a, b) => b.accuracy - a.accuracy)

  return {
    totalAttempted,
    totalMcqs,
    overallAccuracy,
    bestSubject: sorted[0]?.name || 'No attempts yet',
    weakestSubject: sorted.at(-1)?.name || 'No attempts yet',
  }
}
