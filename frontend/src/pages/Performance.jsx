import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
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
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const [summaryRes, historyRes, subjectRes] = await Promise.all([
          API.get('/tests/summary'),
          API.get('/tests/my'),
          API.get('/tests/subjects'),
        ])

        setSummary(summaryRes.data)
        setSessions(historyRes.data.sessions || [])
        setSubjects(subjectRes.data.subjects || [])
      } catch {
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

  // Prepare chart data — last 10 tests for trend line
  const trendData = [...sessions]
    .reverse()
    .slice(-10)
    .map((s, i) => ({
      name: `Test ${i + 1}`,
      percentage: s.percentage,
      date: new Date(s.submittedAt).toLocaleDateString(),
    }))

  // Subject bar chart data
  const subjectData = subjects.map((s) => ({
    name: s.subject,
    avg: s.avgPercentage,
    best: s.bestPercentage,
  }))

  return (
    <div className="performance">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/dashboard')}>Back</button>
      </div>
      <RoleTabs user={user} />

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

        {/* Progress Trend Chart */}
        {trendData.length > 1 && (
          <div className="chart-section">
            <h3>Score Trend</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [`${value}%`, 'Score']}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date || ''
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ fill: '#38bdf8', r: 5 }}
                    activeDot={{ r: 7, fill: '#22d3ee' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Subject-wise Performance */}
        {subjectData.length > 0 && (
          <div className="chart-section">
            <h3>Subject-wise Performance</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectData} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend
                    wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }}
                  />
                  <Bar
                    dataKey="avg"
                    name="Average"
                    fill="#38bdf8"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="best"
                    name="Best"
                    fill="#34d399"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Test History */}
        <div className="history-section">
          <h3>Recent Tests</h3>
          {sessions.length === 0 ? (
            <p>No tests submitted yet.</p>
          ) : (
            <div className="history-list">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className="history-card"
                  onClick={() => navigate(`/test-review/${session._id}`)}
                >
                  <div className="history-card-left">
                    <div className="history-course">
                      {session.courseId?.name || 'Course'}
                    </div>
                    <div className="history-meta">
                      {session.topic && (
                        <span className="history-topic">{session.topic}</span>
                      )}
                      <span className="history-date">
                        {new Date(session.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="history-card-right">
                    <div className="history-score">
                      {session.finalScore ?? session.score}/{session.totalQuestions}
                    </div>
                    <div
                      className={`history-pct ${
                        session.percentage >= 70
                          ? 'high'
                          : session.percentage >= 40
                          ? 'mid'
                          : 'low'
                      }`}
                    >
                      {session.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
