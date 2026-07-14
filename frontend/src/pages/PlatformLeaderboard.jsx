import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './PlatformPages.css'

const SUBJECT_ACCENTS = {
  Biology: '#1DB884',
  Chemistry: '#7C5CFF',
  Physics: '#4A90E2',
  English: '#F59E0B',
}

const formatDate = (value) => {
  if (!value) return 'No attempts yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No attempts yet'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RankBadge({ rank }) {
  const podium = rank <= 3 ? ` leaderboard-rank--top leaderboard-rank--${rank}` : ''
  return <span className={`leaderboard-rank${podium}`}>#{rank}</span>
}

function LeaderboardTable({ rows = [], currentStudent, showSubject = false }) {
  const hasCurrentOutsideTop = currentStudent && !rows.some((row) => row.studentId === currentStudent.studentId)
  const visibleRows = hasCurrentOutsideTop ? [...rows, currentStudent] : rows

  if (!visibleRows.length) {
    return (
      <div className="empty-state empty-state--compact leaderboard-empty">
        <div className="empty-orb" />
        <h3>No leaderboard data yet</h3>
        <p>Rankings will appear after students submit MCQ attempts.</p>
      </div>
    )
  }

  return (
    <div className="leaderboard-table-wrap">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Student</th>
            {showSubject ? <th>Subjects</th> : null}
            <th>Accuracy</th>
            <th>Score</th>
            <th>Attempts</th>
            <th>Last Attempt</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={`${row.studentId}-${row.rank}`} className={row.isCurrentUser ? 'leaderboard-row--me' : ''}>
              <td><RankBadge rank={row.rank} /></td>
              <td>
                <div className="leaderboard-student-cell">
                  <span className="leaderboard-avatar">{String(row.name || 'S').slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{row.name}</strong>
                    {row.isCurrentUser ? <small>Your position</small> : <small>{row.email || 'Student'}</small>}
                  </div>
                </div>
              </td>
              {showSubject ? <td><span className="leaderboard-subject-list">{row.subjects?.join(', ') || 'All'}</span></td> : null}
              <td><strong>{row.accuracy || 0}%</strong></td>
              <td>{row.totalScore || 0}/{row.totalQuestions || 0}</td>
              <td>{row.attempts || 0}</td>
              <td>{formatDate(row.lastAttemptAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PlatformLeaderboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overall')

  useEffect(() => {
    let alive = true
    setLoading(true)
    API.get('/tests/leaderboard', { params: { limit: 50 } })
      .then((res) => {
        if (alive) setData(res.data)
      })
      .catch((error) => toast.error(getUserFriendlyErrorMessage(error, 'We could not load leaderboards right now.')))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const subjectTabs = data?.subjects || []
  const activeSubject = subjectTabs.find((item) => item.subject === activeTab)
  const currentRows = activeTab === 'overall' ? (data?.overall || []) : (activeSubject?.rows || [])
  const currentStudent = activeTab === 'overall' ? data?.currentStudent : activeSubject?.currentStudent
  const totalRanked = activeTab === 'overall' ? data?.summary?.totalRanked : activeSubject?.totalRanked
  const averageAccuracy = useMemo(() => {
    if (!currentRows.length) return 0
    return Math.round(currentRows.reduce((sum, row) => sum + (Number(row.accuracy) || 0), 0) / currentRows.length)
  }, [currentRows])

  return (
    <div className="workspace-page animate-fade-up leaderboard-page">
      <section className="workspace-card leaderboard-hero">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Leaderboard</div>
            <h2 className="workspace-card-title">
              {user?.role === 'student' ? 'Track your rank across MDCAT practice' : 'Student rankings by subject and overall performance'}
            </h2>
            <p>Ranks update from submitted test attempts using weighted accuracy, attempted MCQs, and attempt volume.</p>
          </div>
        </div>
      </section>

      <div className="card-grid leaderboard-stat-grid">
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>Total Ranked</span></div><strong>{loading ? '...' : totalRanked || 0}</strong><small>{activeTab === 'overall' ? 'Overall students' : `${activeTab} students`}</small></div>
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>Average Accuracy</span></div><strong>{loading ? '...' : `${averageAccuracy}%`}</strong><small>Visible top leaderboard average</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>Your Rank</span></div><strong>{currentStudent ? `#${currentStudent.rank}` : '-'}</strong><small>{user?.role === 'student' ? 'Based on your submitted attempts' : 'Student-only metric'}</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>Subjects</span></div><strong>{data?.summary?.visibleSubjects?.length || 0}</strong><small>{user?.role === 'teacher' ? 'Assigned subjects only' : 'MDCAT subjects'}</small></div>
      </div>

      <section className="workspace-card leaderboard-card">
        <div className="workspace-card-head leaderboard-card-head">
          <div>
            <div className="label-xs">Rankings</div>
            <h2 className="workspace-card-title">{activeTab === 'overall' ? 'Overall leaderboard' : `${activeTab} leaderboard`}</h2>
          </div>
          <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard scope">
            <button className={activeTab === 'overall' ? 'active' : ''} type="button" onClick={() => setActiveTab('overall')}>Overall</button>
            {subjectTabs.map((subject) => (
              <button
                key={subject.subject}
                className={activeTab === subject.subject ? 'active' : ''}
                type="button"
                onClick={() => setActiveTab(subject.subject)}
                style={{ '--subject-accent': SUBJECT_ACCENTS[subject.subject] || '#7C5CFF' }}
              >
                {subject.subject}
              </button>
            ))}
          </div>
        </div>
        <div className="workspace-card-body">
          {loading ? (
            <div className="empty-state empty-state--compact leaderboard-empty">
              <div className="loading-spinner" />
              <h3>Loading leaderboard</h3>
              <p>Calculating latest student rankings.</p>
            </div>
          ) : (
            <LeaderboardTable rows={currentRows} currentStudent={currentStudent} showSubject={activeTab === 'overall'} />
          )}
        </div>
      </section>
    </div>
  )
}