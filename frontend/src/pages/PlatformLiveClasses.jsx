import { useAuth } from '../context/AuthContext'
import './PlatformPages.css'
import { liveClasses, recordings } from './platformContent'

function StudentLiveClasses() {
  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-hero workspace-hero--teal">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-copy">
            <div className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Live Classes</div>
            <h1 style={{ color: '#fff' }}>Join high-yield live revision sessions</h1>
            <p>Stay close to your teachers, real-time Q&A, and the latest topic-wise recordings.</p>
          </div>
          <div className="workspace-hero-stats">
            <div className="hero-mini-card hero-mini-card--live">
              <div className="hero-live-label"><span className="hero-live-dot" /> LIVE NOW</div>
              <strong className="hero-session-count">0 sessions</strong>
              <p className="hero-session-name">Real live classes will appear after teachers schedule them.</p>
              <button className="btn btn-danger btn-sm" type="button" disabled>Join Active Session</button>
            </div>
          </div>
        </div>
      </section>

      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Upcoming</div><h2 className="workspace-card-title">Scheduled classes</h2></div></div>
          <div className="workspace-card-body list-stack">
            {liveClasses.map((session) => (
              <div key={session.title} className="session-row">
                <div className={session.live ? 'live-indicator' : 'notification-dot'} />
                <div style={{ flex: 1 }}>
                  <div className="workspace-card-title-row">
                    <strong>{session.title}</strong>
                    <span className="state-chip state-chip--neutral">{session.attendees} attending</span>
                  </div>
                  <p>{session.course} • {session.host}</p>
                  <small>{session.time}</small>
                </div>
                <div className="inline-actions">
                  <button className="btn btn-primary btn-sm" type="button">{session.live ? 'Join Now' : 'Set Reminder'}</button>
                </div>
              </div>
            ))}
            {liveClasses.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No live classes scheduled</h3>
                <p>Teachers can schedule real sessions from the teacher workspace.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Recordings</div><h3 className="workspace-card-title">Replay anytime</h3></div></div>
          <div className="workspace-card-body list-stack">
            {recordings.map((recording) => (
              <div key={recording.title} className="timeline-item">
                <div className="timeline-dot" style={{ background: 'var(--teal)' }} />
                <div>
                  <strong>{recording.title}</strong>
                  <p>{recording.teacher}</p>
                  <small>{recording.duration}</small>
                </div>
              </div>
            ))}
            {recordings.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No recordings yet</h3>
                <p>Recordings will appear after real live classes are completed.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function TeacherLiveClasses() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="split-layout">
        <section className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Schedule Class</div><h2 className="workspace-card-title">Create a live session</h2></div></div>
          <div className="workspace-card-body form-shell">
            <div className="floating-grid">
              <div className="floating-field"><label htmlFor="live-title">Session title</label><input id="live-title" type="text" placeholder="Enter live class title" /></div>
              <div className="floating-field"><label htmlFor="live-course">Subject</label><select id="live-course" defaultValue=""><option value="">Select subject</option><option>Biology</option><option>Chemistry</option><option>Physics</option><option>English</option></select></div>
              <div className="floating-field"><label htmlFor="live-date">Date</label><input id="live-date" type="date" /></div>
              <div className="floating-field"><label htmlFor="live-time">Time</label><input id="live-time" type="time" /></div>
            </div>
            <div className="inline-actions">
              <button className="btn btn-success" type="button">Publish Session</button>
              <button className="btn btn-ghost" type="button">Save Draft</button>
            </div>
          </div>
        </section>

        <aside className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Host Notes</div><h3 className="workspace-card-title">Delivery checklist</h3></div></div>
          <div className="workspace-card-body list-stack">
            <div className="metric-row"><span>Slides uploaded</span><span className="toggle toggle--on" /></div>
            <div className="metric-row"><span>Reminder enabled</span><span className="toggle toggle--on" /></div>
            <div className="metric-row"><span>Recording auto-save</span><span className="toggle toggle--on" /></div>
          </div>
        </aside>
      </div>

      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Upcoming Sessions</div><h3 className="workspace-card-title">Edit, cancel, or monitor attendance</h3></div></div>
        <div className="workspace-card-body list-stack">
          {liveClasses.map((session) => (
            <div key={session.title} className="session-row">
              <div className={session.live ? 'live-indicator' : 'notification-dot'} />
              <div style={{ flex: 1 }}>
                <strong>{session.title}</strong>
                <p>{session.course} • {session.time}</p>
                <small>{session.attendees} attendees registered</small>
              </div>
              <div className="inline-actions">
                <button className="btn btn-secondary btn-sm" type="button">Edit</button>
                <button className="btn btn-danger btn-sm" type="button">Cancel</button>
                <button className="btn btn-ghost btn-sm" type="button">Download Recording</button>
              </div>
            </div>
          ))}
          {liveClasses.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <div className="empty-orb" />
              <h3>No upcoming sessions</h3>
              <p>Use the schedule form to create the first real class.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function PlatformLiveClasses() {
  const { user } = useAuth()
  if (['teacher', 'admin', 'superadmin'].includes(user?.role)) return <TeacherLiveClasses />
  return <StudentLiveClasses />
}
