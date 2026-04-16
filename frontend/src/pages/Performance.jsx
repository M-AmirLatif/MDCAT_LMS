import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import { getAuthToken } from '../services/authStorage'
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken()
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

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading performance...</p>
        </div>
      </div>
    )
  }

  const trendData = [...sessions]
    .reverse()
    .slice(-10)
    .map((s, i) => ({
      name: `Test ${i + 1}`,
      percentage: s.percentage,
      date: new Date(s.submittedAt).toLocaleDateString(),
    }))

  const subjectData = subjects.map((s) => ({
    name: s.subject,
    avg: s.avgPercentage,
    best: s.bestPercentage,
  }))

  return (
    <div className="performance page-content">
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

        {trendData.length > 1 && (
          <div className="chart-section">
            <h3>Score Trend</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#1e293b',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [`${value}%`, 'Score']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {subjectData.length > 0 && (
          <div className="chart-section">
            <h3>Subject-wise Performance</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectData} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#1e293b',
                      fontSize: '13px',
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
                  <Bar dataKey="avg" name="Average" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="best" name="Best" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

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
                    <div className="history-course">{session.courseId?.name || 'Course'}</div>
                    <div className="history-meta">
                      {session.topic && <span className="history-topic">{session.topic}</span>}
                      <span className="history-date">{new Date(session.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="history-card-right">
                    <div className="history-score">{session.finalScore ?? session.score}/{session.totalQuestions}</div>
                    <div
                      className={`history-pct ${
                        session.percentage >= 70 ? 'high' : session.percentage >= 40 ? 'mid' : 'low'
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
