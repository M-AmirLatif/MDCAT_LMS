import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import './LiveSessions.css'

export default function LiveSessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await API.get('/live-sessions')
        setSessions(res.data.sessions || [])
      } catch (err) {
        setError('Failed to load live sessions')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  if (loading)
    return (
      <div className="live-sessions">
        <p>Loading sessions...</p>
      </div>
    )

  return (
    <div className="live-sessions">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/dashboard')}>Back</button>
      </div>

      <div className="live-sessions-container">
        <div className="header-row">
          <div>
            <h2>Live Classes</h2>
            <p>Join scheduled live sessions.</p>
          </div>
          {isTeacher && (
            <button onClick={() => navigate('/live-sessions/create')}>
              Schedule Session
            </button>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        {sessions.length === 0 ? (
          <p>No sessions scheduled yet.</p>
        ) : (
          <div className="session-list">
            {sessions.map((session) => (
              <div key={session._id} className="session-card">
                <div>
                  <h3>{session.title}</h3>
                  <p className="meta">
                    Course: {session.courseId?.name || 'Course'}
                  </p>
                  <p className="meta">
                    Scheduled: {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'TBD'}
                  </p>
                  <p className="meta">Status: {session.status}</p>
                </div>
                <div className="actions">
                  <a href={session.joinUrl} target="_blank" rel="noreferrer">
                    Join
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
