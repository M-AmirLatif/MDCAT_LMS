import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import './PlatformPages.css'

const fallbackSubjects = ['Biology', 'Chemistry', 'Physics', 'English']
const fallbackMethods = [
  { id: 'JazzCash', name: 'JazzCash', number: '03006575463', accountName: 'Muhammad Shafiq' },
  { id: 'Easypaisa', name: 'Easypaisa', number: '03350631487', accountName: 'Muhammad Amir' },
]

function formatDate(value) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleDateString()
}

function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase()
  const className =
    normalized === 'approved'
      ? 'status-pill status-pill--paid'
      : normalized === 'rejected'
        ? 'status-pill status-pill--failed'
        : 'status-pill status-pill--pending'

  return <span className={className}>{normalized}</span>
}

function PaymentMethod({ method }) {
  const isJazzCash = method === 'JazzCash'
  return (
    <span className={`payment-method-pill ${isJazzCash ? 'payment-method-pill--jazzcash' : 'payment-method-pill--card'}`}>
      <span className="payment-method-icon">{isJazzCash ? 'JC' : 'EP'}</span>
      {method}
    </span>
  )
}

function StudentPayments() {
  const [subjects, setSubjects] = useState(fallbackSubjects)
  const [methods, setMethods] = useState(fallbackMethods)
  const [subjectFee, setSubjectFee] = useState(1000)
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('JazzCash')
  const [transactionId, setTransactionId] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [requests, setRequests] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const totalAmount = selectedSubjects.length * subjectFee
  const activeSubjects = subscriptions
    .filter((subscription) => subscription.active)
    .map((subscription) => subscription.subjectId)

  const load = async () => {
    setLoading(true)
    try {
      const [methodsRes, requestsRes, subscriptionsRes] = await Promise.all([
        API.get('/payments/methods'),
        API.get('/payments/my-requests'),
        API.get('/subscriptions/my-subscriptions'),
      ])
      setSubjects(methodsRes.data.subjects || fallbackSubjects)
      setMethods(methodsRes.data.methods || fallbackMethods)
      setSubjectFee(Number(methodsRes.data.subjectFee) || 1000)
      setRequests(requestsRes.data.requests || [])
      setSubscriptions(subscriptionsRes.data.subscriptions || [])
      setPaymentMethod((current) => current || methodsRes.data.methods?.[0]?.id || 'JazzCash')
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not load payment details right now.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleSubject = (subject) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!selectedSubjects.length) {
      toast.error('Please select at least one subject.')
      return
    }
    if (!transactionId.trim()) {
      toast.error('Enter transaction ID/reference number.')
      return
    }
    if (!screenshot) {
      toast.error('Upload payment screenshot.')
      return
    }

    const formData = new FormData()
    selectedSubjects.forEach((subject) => formData.append('selectedSubjects', subject))
    formData.append('paymentMethod', paymentMethod)
    formData.append('transactionId', transactionId.trim())
    formData.append('screenshot', screenshot)

    setSubmitting(true)
    try {
      await API.post('/payments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Payment request submitted for admin review.')
      setSelectedSubjects([])
      setTransactionId('')
      setScreenshot(null)
      event.target.reset()
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not submit your payment request.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="workspace-page workspace-page--payments animate-fade-up">
      <section className="workspace-card payments-active-plan">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Subject Subscription</div>
            <h2 className="workspace-card-title">Rs {subjectFee} per subject per month</h2>
            <p>Select the subjects you paid for, upload proof, and wait for admin approval.</p>
          </div>
          <span className="badge badge-purple">{activeSubjects.length} active</span>
        </div>
        <div className="workspace-card-body">
          <div className="workspace-columns-3">
            {subjects.map((subject) => (
              <div className="metric-row" key={subject}>
                <span>{subject}</span>
                <strong>{activeSubjects.includes(subject) ? 'Active' : 'Not active'}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="workspace-section-grid">
        <section className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Manual Payment</div>
              <h3 className="workspace-card-title">Submit payment request</h3>
            </div>
          </div>
          <div className="workspace-card-body">
            <form className="form-shell" onSubmit={submit}>
              <div className="payments-method-grid">
                {methods.map((method) => (
                  <div className="pricing-card payments-plan-card" key={method.id}>
                    <div className="label-xs">{method.name}</div>
                    <h3 className="workspace-card-title">{method.number}</h3>
                    <p>{method.accountName}</p>
                  </div>
                ))}
              </div>

              <div className="payments-subject-picker">
                <label>Subjects</label>
                <div className="filter-pills">
                  {subjects.map((subject) => (
                    <button
                      className={`filter-pill ${selectedSubjects.includes(subject) ? 'filter-pill--active' : ''}`}
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="payments-form-grid">
                <div className="floating-field">
                  <label htmlFor="payment-method">Payment Method</label>
                  <select id="payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    {methods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
                  </select>
                </div>
                <div className="floating-field">
                  <label htmlFor="transaction-id">Transaction ID / Reference</label>
                  <input id="transaction-id" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Enter reference number" />
                </div>
                <div className="floating-field">
                  <label htmlFor="payment-screenshot">Payment Screenshot</label>
                  <input id="payment-screenshot" type="file" accept="image/*" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} />
                </div>
              </div>

              <div className="stat-tile stat-tile--teal">
                <span>Total Amount</span>
                <strong>Rs {totalAmount}</strong>
                <small>{selectedSubjects.length} subject{selectedSubjects.length === 1 ? '' : 's'} x Rs {subjectFee}</small>
              </div>

              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit payment request'}
              </button>
            </form>
          </div>
        </section>

        <section className="workspace-card payments-history-card">
          <div className="workspace-card-head"><div><div className="label-xs">History</div><h3 className="workspace-card-title">My payment requests</h3></div></div>
          <div className="workspace-card-body">
            <table className="simple-table">
              <thead><tr><th>Date</th><th>Subjects</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5">Loading...</td></tr>
                ) : requests.length ? requests.map((request) => (
                  <tr key={request._id}>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>{request.selectedSubjects?.join(', ')}</td>
                    <td>Rs {request.amount}</td>
                    <td><PaymentMethod method={request.paymentMethod} /></td>
                    <td><StatusBadge status={request.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5"><div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No requests yet</h3><p>Your submitted payment requests will appear here.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function AdminPayments() {
  const [requests, setRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')

  const totals = useMemo(() => {
    return requests.reduce(
      (acc, request) => {
        acc.total += 1
        acc[request.status] = (acc[request.status] || 0) + 1
        if (request.status === 'approved') acc.revenue += Number(request.amount) || 0
        return acc
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, revenue: 0 },
    )
  }, [requests])

  const load = async () => {
    setLoading(true)
    try {
      const endpoint = statusFilter === 'pending' ? '/admin/payments/pending' : '/admin/payments/all'
      const res = await API.get(endpoint, {
        params: statusFilter !== 'all' && statusFilter !== 'pending' ? { status: statusFilter } : {},
      })
      setRequests(res.data.requests || [])
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not load payment requests.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const approve = async (request) => {
    setSavingId(request._id)
    try {
      await API.patch(`/admin/payments/${request._id}/approve`)
      toast.success('Payment approved.')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Could not approve payment.'))
    } finally {
      setSavingId('')
    }
  }

  const reject = async (request) => {
    const adminNote = window.prompt('Optional rejection note:', request.adminNote || '')
    if (adminNote === null) return
    setSavingId(request._id)
    try {
      await API.patch(`/admin/payments/${request._id}/reject`, { adminNote })
      toast.success('Payment rejected.')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Could not reject payment.'))
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="workspace-page workspace-page--payments animate-fade-up">
      <div className="card-grid">
        <div className="stat-tile"><span>Total Requests</span><strong>{totals.total}</strong><small>Manual submissions</small></div>
        <div className="stat-tile"><span>Pending</span><strong>{totals.pending}</strong><small>Need verification</small></div>
        <div className="stat-tile"><span>Approved</span><strong>{totals.approved}</strong><small>Subscriptions activated</small></div>
        <div className="stat-tile"><span>Approved Revenue</span><strong>Rs {totals.revenue}</strong><small>Manual verified amount</small></div>
      </div>

      <section className="workspace-card payments-history-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Admin Review</div>
            <h2 className="workspace-card-title">Payment requests</h2>
          </div>
          <div className="filter-pills">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button key={status} className={`filter-pill ${statusFilter === status ? 'filter-pill--active' : ''}`} type="button" onClick={() => setStatusFilter(status)}>
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="workspace-card-body">
          <table className="simple-table">
            <thead><tr><th>Student</th><th>Subjects</th><th>Amount</th><th>Method</th><th>Txn ID</th><th>Screenshot</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading...</td></tr>
              ) : requests.length ? requests.map((request) => {
                const student = request.studentId || {}
                return (
                  <tr key={request._id}>
                    <td>{[student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student'}<br /><small>{student.email}</small></td>
                    <td>{request.selectedSubjects?.join(', ')}</td>
                    <td>Rs {request.amount}</td>
                    <td><PaymentMethod method={request.paymentMethod} /></td>
                    <td>{request.transactionId}</td>
                    <td><a className="btn btn-ghost btn-sm" href={request.screenshotUrl} target="_blank" rel="noreferrer">Open</a></td>
                    <td><StatusBadge status={request.status} /></td>
                    <td>
                      {request.status === 'pending' ? (
                        <div className="inline-actions">
                          <button className="btn btn-primary btn-sm" type="button" disabled={savingId === request._id} onClick={() => approve(request)}>Approve</button>
                          <button className="btn btn-ghost btn-sm" type="button" disabled={savingId === request._id} onClick={() => reject(request)}>Reject</button>
                        </div>
                      ) : (
                        <small>{request.adminNote || formatDate(request.approvedAt || request.rejectedAt)}</small>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan="8"><div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No payment requests</h3><p>Student payment requests will appear here.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default function PlatformPayments() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <AdminPayments />
  return <StudentPayments />
}
