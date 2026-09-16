const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English', 'Past Papers', 'FLPs', 'Logical Reasoning']

const normalizeSubject = (value) => {
  const raw = String(value || '').trim().toLowerCase().replace(/-/g, ' ')
  if (raw === 'flps' || raw === 'flp' || raw === 'full length papers') return 'FLPs'
  if (raw === 'logical reasoning' || raw === 'logical-reasoning') return 'Logical Reasoning'
  return SUBJECTS.find((subject) => subject.toLowerCase() === raw) || ''
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

const canTeacherAccessSubject = (user, subject) => {
  const normalized = normalizeSubject(subject)
  if (!normalized) return false
  if (normalized === 'Past Papers' || normalized === 'FLPs') return true
  return getTeacherSubjects(user).includes(normalized)
}

module.exports = {
  SUBJECTS,
  normalizeSubject,
  normalizeSubjects,
  getTeacherSubjects,
  canTeacherAccessSubject,
}
