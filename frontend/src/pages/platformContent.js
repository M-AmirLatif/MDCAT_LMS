import mdcatData from '../data/mdcatData.json'

export const SUBJECT_STYLES = {
  Biology: { className: 'card-biology', banner: 'linear-gradient(135deg, #1db884 0%, #34d49a 100%)', progress: 'var(--grad-teal)', accent: 'var(--teal)' },
  Chemistry: { className: 'card-chemistry', banner: 'linear-gradient(135deg, #6c47ff 0%, #1db884 100%)', progress: 'linear-gradient(135deg, #6C47FF 0%, #1DB884 100%)', accent: 'var(--purple)' },
  Physics: { className: 'card-physics', banner: 'linear-gradient(135deg, #4a90e2 0%, #73b1ff 100%)', progress: 'linear-gradient(135deg, #4A90E2 0%, #73B1FF 100%)', accent: 'var(--indigo)' },
  English: { className: 'card-english', banner: 'linear-gradient(135deg, #f59e0b 0%, #ffb648 100%)', progress: 'linear-gradient(135deg, #F59E0B 0%, #FFB648 100%)', accent: 'var(--amber-dark)' },
}

const subjectAttemptMap = {
  biology: { attempted: 11, accuracy: 82, recent: [62, 68, 75, 80, 84, 88] },
  chemistry: { attempted: 9, accuracy: 74, recent: [58, 63, 67, 70, 73, 78] },
  physics: { attempted: 6, accuracy: 66, recent: [52, 56, 60, 64, 68, 71] },
  english: { attempted: 7, accuracy: 79, recent: [61, 67, 72, 76, 79, 83] },
}

const chapterAttemptMap = {
  'bio-cell': { attempted: 2, bestScore: 67 },
  'bio-biomolecules': { attempted: 2, bestScore: 100 },
  'bio-enzymes': { attempted: 3, bestScore: 67 },
  'bio-genetics': { attempted: 2, bestScore: 67 },
  'bio-physiology': { attempted: 2, bestScore: 100 },
  'chem-atomic': { attempted: 2, bestScore: 100 },
  'chem-bonding': { attempted: 2, bestScore: 67 },
  'chem-stoich': { attempted: 2, bestScore: 67 },
  'chem-states': { attempted: 1, bestScore: 33 },
  'chem-organic': { attempted: 2, bestScore: 67 },
  'phys-kinematics': { attempted: 1, bestScore: 50 },
  'phys-dynamics': { attempted: 2, bestScore: 100 },
  'phys-work': { attempted: 1, bestScore: 50 },
  'phys-waves': { attempted: 1, bestScore: 50 },
  'phys-electro': { attempted: 1, bestScore: 100 },
  'eng-vocab': { attempted: 2, bestScore: 100 },
  'eng-grammar': { attempted: 1, bestScore: 50 },
  'eng-correction': { attempted: 2, bestScore: 100 },
  'eng-reading': { attempted: 1, bestScore: 50 },
  'eng-analogy': { attempted: 1, bestScore: 100 },
}

export const mdcatSubjects = mdcatData.subjects.map((subject) => {
  const chapters = mdcatData.chapters.filter((chapter) => chapter.subjectId === subject.id)
  const mcqs = mdcatData.mcqs.filter((mcq) => mcq.subjectId === subject.id)
  const attempt = subjectAttemptMap[subject.id]

  return {
    ...subject,
    chapters,
    totalChapters: chapters.length,
    totalMcqs: mcqs.length,
    attemptedMcqs: attempt.attempted,
    accuracy: attempt.accuracy,
    theme: subject.name,
  }
})

export const mdcatChapters = mdcatData.chapters.map((chapter) => {
  const subject = mdcatData.subjects.find((item) => item.id === chapter.subjectId)
  const mcqs = mdcatData.mcqs.filter((mcq) => mcq.chapterId === chapter.id)
  const stats = chapterAttemptMap[chapter.id] || { attempted: 0, bestScore: 0 }

  return {
    ...chapter,
    subjectName: subject?.name || '',
    totalMcqs: mcqs.length,
    attemptedCount: stats.attempted,
    bestScore: stats.bestScore,
    mcqs,
  }
})

export const practiceAttempts = [
  { subject: 'Biology', chapter: 'Enzymes', score: 67, correct: 2, total: 3, date: 'Today, 8:10 PM' },
  { subject: 'Chemistry', chapter: 'Atomic Structure', score: 100, correct: 3, total: 3, date: 'Today, 6:40 PM' },
  { subject: 'English', chapter: 'Sentence Correction', score: 100, correct: 2, total: 2, date: 'Yesterday' },
  { subject: 'Physics', chapter: 'Dynamics', score: 100, correct: 2, total: 2, date: 'Yesterday' },
]

export const performanceTrend = [
  { label: 'Week 1', Biology: 62, Chemistry: 58, Physics: 52, English: 61 },
  { label: 'Week 2', Biology: 68, Chemistry: 63, Physics: 56, English: 67 },
  { label: 'Week 3', Biology: 75, Chemistry: 67, Physics: 60, English: 72 },
  { label: 'Week 4', Biology: 80, Chemistry: 70, Physics: 64, English: 76 },
  { label: 'Week 5', Biology: 84, Chemistry: 73, Physics: 68, English: 79 },
  { label: 'Week 6', Biology: 88, Chemistry: 78, Physics: 71, English: 83 },
]

export const studentNotifications = [
  { title: 'Biology physiology streak is active', body: 'You have completed 2 physiology drills. Continue to protect your 82% biology accuracy.', tone: 'teal', time: 'Today, 8:40 PM' },
  { title: 'Chemistry needs recovery practice', body: 'Stoichiometry and states of matter are currently your weakest chemistry chapters.', tone: 'purple', time: 'Today, 6:20 PM' },
  { title: 'English chapter set unlocked', body: 'Analogies and vocabulary revision set is ready for your next quick practice round.', tone: 'amber', time: 'Yesterday' }
]

export const liveClasses = [
  { title: 'Biology Physiology MCQ Clinic', course: 'Human Physiology', time: 'Today, 8:00 PM', attendees: 184, live: true, host: 'Dr. Hira Khan' },
  { title: 'Chemistry Bonding Revision', course: 'Chemical Bonding', time: 'Tomorrow, 6:30 PM', attendees: 96, live: false, host: 'Prof. Adeel Raza' },
  { title: 'Physics Dynamics Sprint', course: 'Dynamics', time: '03 May, 7:00 PM', attendees: 122, live: false, host: 'Sir Moeez Ali' }
]

export const recordings = [
  { title: 'English Grammar Quick Fixes', duration: '34 min', teacher: 'Ma’am Sana Noor' },
  { title: 'Biology Genetics Review', duration: '41 min', teacher: 'Dr. Hira Khan' },
  { title: 'Chemistry Organic Basics', duration: '39 min', teacher: 'Prof. Adeel Raza' }
]

export const teacherMcqSummary = mdcatSubjects.map((subject) => ({
  subject: subject.name,
  chapters: subject.totalChapters,
  mcqs: subject.totalMcqs,
  uploadedBy: subject.name === 'Chemistry' ? 'Prof. Adeel Raza' : subject.name === 'English' ? 'Ma’am Sana Noor' : subject.name === 'Physics' ? 'Sir Moeez Ali' : 'Dr. Hira Khan',
}))

export const teacherStudents = [
  { name: 'Ayesha Rehman', city: 'Lahore', score: 88, streak: '13 days', risk: 'Low', email: 'ayesha@example.com' },
  { name: 'Usman Tariq', city: 'Rawalpindi', score: 64, streak: '4 days', risk: 'Medium', email: 'usman@example.com' },
  { name: 'Iqra Javed', city: 'Multan', score: 51, streak: '1 day', risk: 'High', email: 'iqra@example.com' },
  { name: 'Hamza Yasir', city: 'Faisalabad', score: 77, streak: '9 days', risk: 'Low', email: 'hamza@example.com' }
]

export const teacherAssignments = [
  { title: 'Enzyme Inhibition Drill Review', submissions: 318, due: '02 May', status: 'Active' },
  { title: 'Atomic Structure Error Analysis', submissions: 281, due: '30 Apr', status: 'Submitted' },
  { title: 'Dynamics Concept Reinforcement', submissions: 244, due: '27 Apr', status: 'Graded' }
]

export const adminStudents = [
  { name: 'Areeba Nisar', plan: 'Premium Plus', city: 'Karachi', status: 'Active', tests: 42 },
  { name: 'Muhammad Talha', plan: 'Starter', city: 'Peshawar', status: 'Suspended', tests: 12 },
  { name: 'Noor Ul Ain', plan: 'Annual', city: 'Lahore', status: 'Active', tests: 59 }
]

export const adminTeachers = [
  { name: 'Dr. Hira Khan', subject: 'Biology', rating: 4.9, pending: 'Approved', students: 1820 },
  { name: 'Prof. Adeel Raza', subject: 'Chemistry', rating: 4.8, pending: 'Pending', students: 1264 },
  { name: 'Sir Moeez Ali', subject: 'Physics', rating: 4.7, pending: 'Approved', students: 987 },
  { name: 'Ma’am Sana Noor', subject: 'English', rating: 4.8, pending: 'Approved', students: 1140 }
]

export const adminTransactions = [
  { student: 'Areeba Nisar', amount: 'Rs 8,500', method: 'JazzCash', status: 'Paid', date: '01 May' },
  { student: 'Noor Ul Ain', amount: 'Rs 15,000', method: 'Card', status: 'Paid', date: '30 Apr' },
  { student: 'Talha Ahmed', amount: 'Rs 8,500', method: 'EasyPaisa', status: 'Refunded', date: '29 Apr' }
]

export const superAdminLogs = [
  { severity: 'Critical', service: 'MCQ Moderation', message: 'Two physics uploads were flagged for duplicated wording and held for review.', time: '01 May, 10:14 PM' },
  { severity: 'Warning', service: 'Practice Analytics', message: 'Subject-wise trend recalculation crossed the normal latency threshold.', time: '01 May, 9:42 PM' },
  { severity: 'Info', service: 'Sessions', message: 'Teacher chapter management permissions updated successfully.', time: '01 May, 8:15 PM' }
]

export const permissionMatrix = [
  ['Subjects', 'View', 'Edit Own', 'Manage', 'Manage'],
  ['Chapters', 'View', 'Manage', 'Manage', 'Manage'],
  ['MCQs', 'Attempt', 'Create/Edit', 'Moderate', 'Moderate'],
  ['Analytics', 'View Own', 'View Class', 'View Global', 'View Global'],
  ['Users', 'None', 'None', 'Manage', 'Manage']
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

export function getMcqsByChapter(subjectId, chapterId) {
  return mdcatData.mcqs.filter((mcq) => mcq.subjectId === subjectId && mcq.chapterId === chapterId)
}

export function getPerformanceSummary() {
  const totalAttempted = mdcatSubjects.reduce((sum, subject) => sum + subject.attemptedMcqs, 0)
  const totalMcqs = mdcatSubjects.reduce((sum, subject) => sum + subject.totalMcqs, 0)
  const overallAccuracy = Math.round(mdcatSubjects.reduce((sum, subject) => sum + subject.accuracy, 0) / mdcatSubjects.length)
  const sorted = [...mdcatSubjects].sort((a, b) => b.accuracy - a.accuracy)

  return {
    totalAttempted,
    totalMcqs,
    overallAccuracy,
    bestSubject: sorted[0]?.name || 'Biology',
    weakestSubject: sorted.at(-1)?.name || 'Physics',
  }
}
