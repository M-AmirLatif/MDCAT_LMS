import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import useMcqSubjectSummary from '../hooks/useMcqSubjectSummary'
import useStudentPerformanceData from '../hooks/useStudentPerformanceData'
import useThemeMode from '../hooks/useThemeMode'
import './PlatformPages.css'
import {
  adminTeachers,
  liveClasses,
  mdcatSubjects,
  SUBJECT_STYLES,
  studentNotifications,
  teacherStudents,
} from './platformContent'

function SubjectGlyph({ subject }) {
  const strokes = {
    Biology: 'M12 4c-4 0-7 3.5-7 8 0 3.8 2.2 6.5 7 8 4.8-1.5 7-4.2 7-8 0-4.5-3-8-7-8Zm0 0v16M8 9c1.2 1.4 2.4 2.1 4 2.1 1.7 0 2.9-.7 4-2.1',
    Chemistry: 'M10 3v6l-5.6 8.8A2 2 0 0 0 6.1 21h11.8a2 2 0 0 0 1.7-3.2L14 9V3M8.5 13h7',
    Physics: 'M12 3v4M12 17v4M4 12H0m24 0h-4M5.6 5.6 2.8 2.8m18.4 18.4-2.8-2.8M18.4 5.6l2.8-2.8M5.6 18.4l-2.8 2.8M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
    English: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16ZM9 7h6M9 11h6M9 15h4',
  }

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d={strokes[subject]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StudentDashboard({ firstName }) {
  const chartTheme = useThemeMode()
  const { subjects, summary, performanceTrend, loading } = useStudentPerformanceData()
  const visibleSubjects = subjects.length ? subjects : mdcatSubjects

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-hero">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-copy">
            <div className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Student Dashboard</div>
            <h1 className="gradient-text" style={{ WebkitTextFillColor: 'unset', color: '#fff' }}>
              Practice MDCAT chapter by chapter, {firstName}
            </h1>
            <p>
              Focus only on Biology, Chemistry, Physics, and English with chapter-wise MCQ sets, clean explanations, and subject-wise tracking after every attempt.
            </p>
            <div className="workspace-hero-actions">
              <Link className="btn btn-primary" to="/mcqs">Open Subjects</Link>
              <Link className="btn btn-secondary" to="/performance">View Performance</Link>
            </div>
          </div>

          <div className="workspace-hero-stats">
            <div className="hero-mini-card">
              <span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Attempted MCQs</span>
              <strong>{summary.totalAttempted}/{summary.totalMcqs}</strong>
              <p>Across all four MDCAT subjects</p>
            </div>
            <div className="hero-mini-card">
              <span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Overall Accuracy</span>
              <strong>{summary.overallAccuracy}%</strong>
              <p>Accuracy will update after real MCQ attempts</p>
            </div>
          </div>
        </div>
      </section>

      <div className="workspace-columns-4">
        {visibleSubjects.map((subject) => (
          <article key={subject.id} className={`workspace-card subject-focus-card ${SUBJECT_STYLES[subject.name].className}`}>
            <div className="workspace-card-head subject-focus-topline">
              <div className="subject-focus-head">
                <span className={`subject-focus-icon subject-focus-icon--${subject.id}`}>
                  <SubjectGlyph subject={subject.name} />
                </span>
                <div>
                  <div className="label-xs" style={{ color: SUBJECT_STYLES[subject.name].accent }}>{subject.name}</div>
                  <h3 className="workspace-card-title">{subject.totalChapters} Chapters</h3>
                </div>
              </div>
              <span className="state-chip state-chip--neutral subject-accuracy-chip">{subject.accuracy}% accuracy</span>
            </div>
            <div className="workspace-card-body subject-focus-body">
              <div className="subject-focus-metrics">
                <div><span>Total MCQs</span><strong>{subject.totalMcqs}</strong></div>
                <div><span>Attempted</span><strong>{subject.attemptedMcqs}</strong></div>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ '--fill': `${subject.accuracy}%`, width: `${subject.accuracy}%`, background: SUBJECT_STYLES[subject.name].progress }} />
              </div>
              <Link className="btn btn-primary btn-sm" to={`/mcqs/${subject.id}`}>Continue Practice</Link>
            </div>
          </article>
        ))}
      </div>

      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Progress</div>
              <h3 className="workspace-card-title">Subject-wise momentum</h3>
            </div>
          </div>
          <div className="workspace-card-body chart-panel">
            {!loading && performanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrend}>
                <defs>
                  <linearGradient id="studentAreaBio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1db884" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1db884" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} />
                <XAxis dataKey="attemptDate" axisLine={false} tickLine={false} tick={{ fill: chartTheme.axisColor, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTheme.axisColor, fontSize: 12 }} domain={[40, 100]} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, color: chartTheme.tooltipText, border: 'none', borderRadius: 12 }} labelStyle={{ color: chartTheme.tooltipText }} />
                <Area type="monotone" dataKey="Biology" stroke="#1db884" fill="url(#studentAreaBio)" strokeWidth={3} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No performance data yet</h3>
                <p>Subject-wise graphs will appear after students attempt real MCQs.</p>
              </div>
            )}
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Notifications</div>
              <h3 className="workspace-card-title">Practice prompts</h3>
            </div>
          </div>
          <div className="workspace-card-body list-stack">
            {studentNotifications.map((item) => (
              <div key={item.title} className={`notification-row notification-row--${item.tone}`}>
                <div className="notification-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <small>{item.time}</small>
                </div>
              </div>
            ))}
            {studentNotifications.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No notifications yet</h3>
                <p>Practice prompts and system updates will appear after real activity starts.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function TeacherDashboard() {
  const { subjects, totals, teacherSummary } = useMcqSubjectSummary()
  const totalMcqs = totals.totalMcqs
  const totalChapters = totals.totalChapters

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-hero workspace-hero--teal">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-copy">
            <div className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Teacher Dashboard</div>
            <h1 style={{ color: '#fff' }}>Manage MDCAT chapters, MCQs, and explanations from one focused workspace</h1>
            <p>Track uploads by subject, monitor student attempts, and keep the Biology, Chemistry, Physics, and English bank clean and exam-relevant.</p>
            <div className="workspace-hero-actions">
              <Link className="btn btn-primary" to="/teacher/mcqs">Open MCQ Management</Link>
              <Link className="btn btn-secondary" to="/teacher/analytics">View Analytics</Link>
            </div>
          </div>
          <div className="workspace-hero-stats">
            <div className="hero-mini-card">
              <span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Total Uploaded MCQs</span>
              <strong>{totalMcqs}</strong>
              <p>Live chapter-wise bank count</p>
            </div>
            <div className="hero-mini-card">
              <span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Student Attempts</span>
              <strong>0</strong>
              <p>Attempts will update after students start practicing</p>
            </div>
          </div>
        </div>
      </section>

      <div className="workspace-columns-4">
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>Total MCQs</span><span className="badge badge-teal">Bank</span></div><strong>{totalMcqs}</strong><small>Live count from uploaded subject banks</small></div>
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>Total Chapters</span><span className="badge badge-purple">Coverage</span></div><strong>{totalChapters}</strong><small>Chapter count across MDCAT subjects</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>Student Attempts</span><span className="badge badge-amber">Active</span></div><strong>0</strong><small>Attempts will appear after launch</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>Average Score</span><span className="badge badge-coral">Class</span></div><strong>0%</strong><small>Analytics will use real submissions</small></div>
      </div>

      <section className="workspace-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">All MDCAT Subject Banks</div>
            <h3 className="workspace-card-title">Teacher access covers Biology, Chemistry, Physics, and English</h3>
            <p>Each subject is organized into chapter-wise MCQ banks with explanations and difficulty labels.</p>
          </div>
        </div>
        <div className="workspace-card-body">
          <div className="workspace-columns-4">
            {subjects.map((subject) => {
              const style = SUBJECT_STYLES[subject.name]
              return (
                <article key={subject.id} className={`teacher-subject-bank ${style.className}`}>
                  <div className="subject-focus-head">
                    <span className={`subject-focus-icon subject-focus-icon--${subject.id}`}>
                      <SubjectGlyph subject={subject.name} />
                    </span>
                    <div>
                      <div className="label-xs" style={{ color: style.accent }}>{subject.name}</div>
                      <h4>{subject.totalChapters} Chapters</h4>
                    </div>
                  </div>
                  <div className="metric-row">
                    <span>Total MCQs</span>
                    <strong>{subject.totalMcqs}</strong>
                  </div>
                  <Link className="btn btn-secondary btn-sm" to={`/mcqs/${subject.id}`}>Manage Bank</Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">MCQ Coverage</div><h3 className="workspace-card-title">MCQs by subject</h3></div></div>
          <div className="workspace-card-body list-stack">
            {teacherSummary.map((item) => (
              <div key={item.subject} className="course-manage-card" style={{ padding: '18px' }}>
                <div className="workspace-card-title-row">
                  <strong>{item.subject}</strong>
                  <span className="state-chip state-chip--neutral">{item.chapters} chapters</span>
                </div>
                <div className="metric-row"><span>{item.uploadedBy}</span><strong>{item.mcqs} MCQs</strong></div>
              </div>
            ))}
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Recent Upload Focus</div><h3 className="workspace-card-title">Where students need support</h3></div></div>
          <div className="workspace-card-body list-stack">
            {teacherStudents.map((student) => (
              <div key={student.name} className="timeline-item">
                <div className="timeline-dot" style={{ background: student.risk === 'High' ? 'var(--coral)' : student.risk === 'Medium' ? 'var(--amber)' : 'var(--teal)' }} />
                <div>
                  <strong>{student.name}</strong>
                  <p>{student.city} • Current score {student.score}% • {student.streak} streak</p>
                  <small>Risk profile: {student.risk}</small>
                </div>
              </div>
            ))}
            {teacherStudents.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No student attempts yet</h3>
                <p>Student support insights will appear after real practice sessions.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const chartTheme = useThemeMode()
  const { subjects, totals } = useMcqSubjectSummary()
  const subjectMix = subjects.map((subject) => ({
    name: subject.name,
    value: subject.totalMcqs,
    fill: subject.name === 'Biology' ? '#1db884' : subject.name === 'Chemistry' ? '#6c47ff' : subject.name === 'Physics' ? '#4a90e2' : '#f59e0b',
  }))

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-hero workspace-hero--amber">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-copy">
            <div className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Admin Dashboard</div>
            <h1 style={{ color: '#fff' }}>Moderate the MDCAT MCQ bank, teacher uploads, and student performance from one panel</h1>
            <p>Only Biology, Chemistry, Physics, and English are active. Review uploads, chapter coverage, and platform quality without course clutter.</p>
          </div>
          <div className="workspace-hero-stats">
            <div className="hero-mini-card"><span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Active Subjects</span><strong>4</strong><p>Strict MDCAT-only structure enforced</p></div>
            <div className="hero-mini-card"><span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Pending Reviews</span><strong>0</strong><p>Teacher uploads and flagged explanations</p></div>
          </div>
        </div>
      </section>

      <div className="workspace-columns-4">
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>Total Subjects</span><span className="badge badge-purple">Fixed</span></div><strong>4</strong><small>Biology, Chemistry, Physics, English</small></div>
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>Total Chapters</span><span className="badge badge-teal">Organized</span></div><strong>{totals.totalChapters}</strong><small>Live chapter coverage across all subjects</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>Total MCQs</span><span className="badge badge-amber">Moderated</span></div><strong>{totals.totalMcqs}</strong><small>Live MCQ count across all subject banks</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>Teacher Uploads</span><span className="badge badge-coral">Review</span></div><strong>0</strong><small>Moderation queue is empty</small></div>
      </div>

      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Content Mix</div><h3 className="workspace-card-title">MCQs by subject</h3></div></div>
          <div className="workspace-card-body chart-panel">
            {subjectMix.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjectMix} dataKey="value" nameKey="name" outerRadius={96} innerRadius={54} paddingAngle={4} />
                <Tooltip contentStyle={{ background: chartTheme.tooltipBg, color: chartTheme.tooltipText, border: 'none', borderRadius: 12 }} labelStyle={{ color: chartTheme.tooltipText }} />
              </PieChart>
            </ResponsiveContainer>
            ) : (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No MCQs uploaded yet</h3>
                <p>Subject distribution will render after real MCQs are approved.</p>
              </div>
            )}
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Teacher Uploads</div><h3 className="workspace-card-title">Recent subject owners</h3></div></div>
          <div className="workspace-card-body list-stack">
            {adminTeachers.map((teacher) => (
              <div key={teacher.name} className="queue-card">
                <div className="workspace-card-title-row">
                  <strong>{teacher.name}</strong>
                  <span className={`state-chip ${teacher.pending === 'Approved' ? 'state-chip--success' : 'state-chip--warning'}`}>{teacher.pending}</span>
                </div>
                <p>{teacher.subject} • Rating {teacher.rating} • {teacher.students} students</p>
              </div>
            ))}
            {adminTeachers.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No teacher uploads yet</h3>
                <p>Teacher ownership and moderation status will appear after real uploads.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlatformDashboard() {
  const { user } = useAuth()
  const role = user?.role || 'student'
  const firstName = user?.firstName || 'Student'

  const content = useMemo(() => {
    if (role === 'teacher') return <TeacherDashboard />
    if (role === 'admin') return <AdminDashboard />
    return <StudentDashboard firstName={firstName} />
  }, [firstName, role])

  return content
}
