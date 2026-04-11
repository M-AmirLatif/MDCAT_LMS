import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import './Payments.css'

export default function Payments() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [courses, setCourses] = useState([])
  const [formData, setFormData] = useState({
    courseId: '',
    amount: '',
    currency: 'PKR',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const fetchPayments = async () => {
    try {
      const res = await API.get('/payments/my')
      setPayments(res.data.payments || [])
    } catch (err) {
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await API.get('/courses')
      setCourses(res.data.courses || [])
    } catch (err) {
      setError('Failed to load courses')
    }
  }

  useEffect(() => {
    fetchPayments()
    fetchCourses()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const createPayment = async (e) => {
    e.preventDefault()
    try {
      await API.post('/payments', {
        courseId: formData.courseId,
        amount: formData.amount,
        currency: formData.currency,
      })
      setFormData({ courseId: '', amount: '', currency: 'PKR' })
      fetchPayments()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment')
    }
  }

  if (loading)
    return (
      <div className="payments">
        <p>Loading payments...</p>
      </div>
    )

  return (
    <div className="payments">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/dashboard')}>Back</button>
      </div>
      <RoleTabs user={user} />

      <div className="payments-container">
        <h2>Payments</h2>
        {error && <p className="error-message">{error}</p>}

        <form className="payment-form" onSubmit={createPayment}>
          <select
            name="courseId"
            value={formData.courseId}
            onChange={handleChange}
            required
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={handleChange}
            required
          />
          <input
            name="currency"
            placeholder="Currency"
            value={formData.currency}
            onChange={handleChange}
          />
          <button type="submit">Create Payment</button>
        </form>

        {payments.length === 0 ? (
          <p>No payments yet.</p>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.courseId?.name || 'Course'}</td>
                  <td>
                    {payment.amount} {payment.currency}
                  </td>
                  <td>{payment.status}</td>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
