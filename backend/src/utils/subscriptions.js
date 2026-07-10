const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English']
const SUBJECT_FEE = 250

const SUBJECT_NAME_BY_KEY = new Map(
  SUBJECTS.flatMap((subject) => [
    [subject.toLowerCase(), subject],
    [subject.slice(0, 3).toLowerCase(), subject],
  ]),
)

const normalizeSubject = (value) => {
  const key = String(value || '').trim().toLowerCase()
  if (!key) return ''
  return SUBJECT_NAME_BY_KEY.get(key) || SUBJECT_NAME_BY_KEY.get(key.replace(/[^a-z]/g, '')) || ''
}

const normalizeSubjects = (values = []) => {
  const source = Array.isArray(values) ? values : [values]
  return [...new Set(source.map(normalizeSubject).filter(Boolean))]
}

const addMonths = (date, months = 1) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

const hasActiveSubscription = (user, subject, at = new Date()) => {
  const normalized = normalizeSubject(subject)
  if (!normalized) return false

  return (user?.subscriptions || []).some((subscription) => {
    const subjectId = normalizeSubject(subscription.subjectId)
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null
    return subjectId === normalized && endDate && endDate >= at
  })
}

const upsertSubjectSubscriptions = (user, subjects, paymentRequestId, approvedAt = new Date()) => {
  const normalizedSubjects = normalizeSubjects(subjects)
  if (!Array.isArray(user.subscriptions)) user.subscriptions = []

  normalizedSubjects.forEach((subject) => {
    const active = user.subscriptions.find((subscription) => {
      const subjectId = normalizeSubject(subscription.subjectId)
      const endDate = subscription.endDate ? new Date(subscription.endDate) : null
      return subjectId === subject && endDate && endDate >= approvedAt
    })

    if (active) {
      // Important: approving a renewal extends the active subscription window.
      active.endDate = addMonths(active.endDate, 1)
      active.paymentRequestId = paymentRequestId
      return
    }

    user.subscriptions.push({
      subjectId: subject,
      startDate: approvedAt,
      endDate: addMonths(approvedAt, 1),
      paymentRequestId,
    })
  })
}

module.exports = {
  SUBJECTS,
  SUBJECT_FEE,
  normalizeSubject,
  normalizeSubjects,
  hasActiveSubscription,
  upsertSubjectSubscriptions,
}
