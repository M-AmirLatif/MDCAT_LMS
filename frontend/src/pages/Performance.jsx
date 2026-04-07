import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import './Performance.css'

export default function Performance() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({
    totalTests: 0,
    avgPercentage: 0,
    bestPercentage: 0,
    latestPercentage: 0,
    latestAt: null,
  })
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const [summaryRes, historyRes] = await Promise.all([
          API.get('/tests/summary'),
          API.get('/tests/my'),
        ])

        setSummary(summaryRes.data)
        setSessions(historyRes.data.sessions || [])
      } catch (err) {
        setError('Failed to load performance data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  if (loading)
    return (
      <div className="performance">
        <p>Loading performance...</p>
      </div>
    )

  return (
    <div className="performance">
      <div className="navbar">
        <h1>🎓 MDCAT LMS</h1>
        <button onClick={() => navigate('/dashboard')}>Back</button>
      </div>

      <div className="performance-container">
        <h2>Your Performance</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Tests</h3>
            <p>{summary.totalTests}</p>
          </div>
          <div className="stat-card">
            <h3>Average %</h3>
            <p>{summary.avgPercentage}%</p>
          </div>
          <div className="stat-card">
            <h3>Best %</h3>
            <p>{summary.bestPercentage}%</p>
          </div>
          <div className="stat-card">
            <h3>Latest %</h3>
            <p>{summary.latestPercentage}%</p>
          </div>
        </div>

        <div className="history-section">
          <h3>Recent Tests</h3>
          {sessions.length === 0 ? (
            <p>No tests submitted yet.</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session._id}>
                    <td>{session.courseId?.name || 'Course'}</td>
                    <td>
                      {session.score}/{session.totalQuestions}
                    </td>
                    <td>{session.percentage}%</td>
                    <td>
                      {new Date(session.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

