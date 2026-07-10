const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English']

const normalizeSubject = (value) => {
  const raw = String(value || '').trim()
  return SUBJECTS.find((subject) => subject.toLowerCase() === raw.toLowerCase()) || ''
}

const normalizeSubjects = (...values) => {
  const flattened = values.flatMap((value) => {
    if (!value) return []
    if (Array.isArray(value)) return value
    return String(value).split(',')
  })
  return [...new Set(flattened.map(normalizeSubject).filter(Boolean))]
}

const getTeacherSubjects = (user) => {
  const subjects = normalizeSubjects(user?.assignedSubjects)
  if (subjects.length) return subjects
  return normalizeSubjects(user?.assignedSubject)
}

const canTeacherAccessSubject = (user, subject) =>
  getTeacherSubjects(user).includes(normalizeSubject(subject))

module.exports = {
  SUBJECTS,
  normalizeSubject,
  normalizeSubjects,
  getTeacherSubjects,
  canTeacherAccessSubject,
}
