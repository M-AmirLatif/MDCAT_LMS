import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import useAdminPanelData from '../hooks/useAdminPanelData'
import useMcqSubjectSummary from '../hooks/useMcqSubjectSummary'
import useStudentPerformanceData from '../hooks/useStudentPerformanceData'
import useTeacherAnalyticsData from '../hooks/useTeacherAnalyticsData'
import './PlatformPages.css'
import {
  mdcatSubjects,
  SUBJECT_STYLES,
  studentNotifications,
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

const getAssignedSubjectNames = (user) => {
  if (user?.role !== 'teacher') return []
  const assigned = Array.isArray(user.assignedSubjects) && user.assignedSubjects.length
    ? user.assignedSubjects
    : user.assignedSubject
      ? [user.assignedSubject]
      : []
  return assigned.map((subject) => String(subject || '').trim()).filter(Boolean)
}

const momentumColors = {
  Biology: '#1db884',
  Chemistry: '#7c5cff',
  Physics: '#4a90e2',
  English: '#f59e0b',
}

const chartTheme = {
  tooltipBg: '#171333',
  tooltipText: '#ffffff',
}

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0))

const buildMomentumPath = (points) => {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const controlOffset = Math.max(18, (point.x - previous.x) * 0.42)
    return `${path} C ${previous.x + controlOffset} ${previous.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`
  }, '')
}

function DashboardMomentumSvg({ data, subjects: subjectNames, overallAccuracy = 0 }) {
  const rows = Array.isArray(data) ? data : []
  const hasRows = rows.length > 0
  const chartRows = hasRows ? rows : [{ attemptLabel: 'A1', Biology: 0, Chemistry: 0, Physics: 0, English: 0 }]
  const width = 760
  const height = 330
  const pad = { top: 28, right: 46, bottom: 54, left: 76 }
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom
  const ticks = [0, 25, 50, 75, 100]
  const xFor = (index) => pad.left + (chartRows.length === 1 ? innerWidth / 2 : (index / (chartRows.length - 1)) * innerWidth)
  const yFor = (value) => pad.top + (1 - clampPercent(value) / 100) * innerHeight
  const visibleLabelStep = Math.max(1, Math.ceil(chartRows.length / 6))
  const overall = clampPercent(overallAccuracy)

  return (
    <div className="dashboard-momentum-svg" aria-label="Subject momentum chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" preserveAspectRatio="none">
        <rect className="dashboard-momentum-bg" x="0" y="0" width={width} height={height} rx="22" />
        {ticks.map((tick) => {
          const y = yFor(tick)
          return (
            <g key={tick}>
              <line className="dashboard-momentum-grid-line" x1={pad.left} x2={width - pad.right} y1={y} y2={y} />
              <text className="dashboard-momentum-axis-label" x={pad.left - 12} y={y + 5} textAnchor="end">{tick}%</text>
            </g>
          )
        })}
        {overall > 0 ? (
          <g>
            <line className="dashboard-momentum-average" x1={pad.left} x2={width - pad.right} y1={yFor(overall)} y2={yFor(overall)} />
            <text className="dashboard-momentum-average-label" x={width - pad.right - 4} y={yFor(overall) - 8} textAnchor="end">Overall {overall}%</text>
          </g>
        ) : null}
        {subjectNames.map((subjectName) => {
          const points = chartRows.map((row, index) => ({
            x: xFor(index),
            y: yFor(row[subjectName]),
          }))
          const path = buildMomentumPath(points)
          const color = momentumColors[subjectName] || SUBJECT_STYLES[subjectName]?.accent || '#7c5cff'

          return (
            <g key={subjectName} className="dashboard-momentum-series" style={{ '--series-color': color }}>
              <path className="dashboard-momentum-line-shadow" d={path} />
              <path className="dashboard-momentum-line" d={path} />
              {points.map((point, index) => (
                <circle
                  key={`${subjectName}-${index}`}
                  className="dashboard-momentum-dot"
                  cx={point.x}
                  cy={point.y}
                  r={hasRows ? 4.2 : 0}
                />
              ))}
            </g>
          )
        })}
        {chartRows.map((row, index) => (
          index % visibleLabelStep === 0 || index === chartRows.length - 1 ? (
            <text key={`${row.attemptLabel}-${index}`} className="dashboard-momentum-x-label" x={xFor(index)} y={height - 12} textAnchor="middle">
              {row.attemptLabel || `A${index + 1}`}
            </text>
          ) : null
        ))}
      </svg>
    </div>
  )
}
function StudentDashboard({ firstName }) {
  const { subjects, summary, performanceTrend, loading } = useStudentPerformanceData()
  const visibleSubjects = subjects.length ? subjects : mdcatSubjects
  const momentumSubjectNames = ['Biology', 'Chemistry', 'Physics', 'English']

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-hero">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-copy">
            <h1 className="gradient-text" style={{ WebkitTextFillColor: 'unset', color: '#fff' }}>
              Practice MDCAT chapter by chapter, {firstName}
            </h1>
            <p>
              Focus on Biology, Chemistry, Physics, and English with chapter based MCQ sets, clear explanations, and progress tracking after every attempt.
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

      <div className="card-grid">
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
              <h3 className="workspace-card-title">Subject momentum</h3>
            </div>
          </div>
          <div className="workspace-card-body chart-panel dashboard-momentum-chart">
            {!loading && performanceTrend.length > 0 ? (
            <>
              <div className="dashboard-momentum-mobile-key">
                {momentumSubjectNames.map((subjectName) => {
                  const latest = [...performanceTrend].reverse().find((point) => Number.isFinite(Number(point[subjectName])))
                  const value = latest ? Math.round(Number(latest[subjectName]) || 0) : 0
                  return (
                    <span key={subjectName}>
                      <i style={{ background: SUBJECT_STYLES[subjectName]?.accent || '#7c5cff' }} />
                      {subjectName}: {value}%
                    </span>
                  )
                })}
              </div>
              <div className="dashboard-momentum-plot">
                <DashboardMomentumSvg
                  data={performanceTrend}
                  subjects={momentumSubjectNames}
                  overallAccuracy={summary.overallAccuracy}
                />
              </div>
            </>
            ) : (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No performance data yet</h3>
                <p>Subject graphs will appear after students attempt real MCQs.</p>
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
  const { user } = useAuth()
  const { subjects, totals, teacherSummary } = useMcqSubjectSummary()
  const { summary, studentRows } = useTeacherAnalyticsData()
  const teacherSubjects = getAssignedSubjectNames(user)
  const visibleSubjects = teacherSubjects.length
    ? subjects.filter((subject) => teacherSubjects.includes(subject.name || subject.subject))
    : subjects
  const visibleTeacherSummary = teacherSubjects.length
    ? teacherSummary.filter((item) => teacherSubjects.includes(item.subject))
    : teacherSummary
  const visibleTotalMcqs = visibleSubjects.reduce((sum, subject) => sum + (Number(subject.totalMcqs) || 0), 0)
  const visibleTotalChapters = visibleSubjects.reduce((sum, subject) => sum + (Number(subject.totalChapters) || 0), 0)
  const totalMcqs = teacherSubjects.length ? visibleTotalMcqs : totals.totalMcqs
  const totalChapters = teacherSubjects.length ? visibleTotalChapters : totals.totalChapters
  const dashboardStudents = studentRows.slice(0, 5)

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-hero workspace-hero--teal">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-copy">
            <div className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Teacher Dashboard</div>
            <h1 style={{ color: '#fff' }}>Manage MDCAT chapters, MCQs, and explanations from one focused workspace</h1>
            <p>Track uploads, monitor student attempts, and manage only your approved MDCAT subject banks.</p>
            <div className="workspace-hero-actions teacher-hero-actions">
              <Link className="btn btn-primary" to="/teacher/mcqs">Open MCQ Management</Link>
              <Link className="btn btn-secondary" to="/teacher/analytics">View Analytics</Link>
            </div>
          </div>
          <div className="workspace-hero-stats">
            <div className="hero-mini-card">
              <span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Total Uploaded MCQs</span>
              <strong>{totalMcqs}</strong>
              <p>Live chapter bank count</p>
            </div>
            <div className="hero-mini-card">
              <span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Student Attempts</span>
              <strong>{summary.totalAttempts}</strong>
              <p>Live submissions from student practice</p>
            </div>
          </div>
        </div>
      </section>

      <div className="card-grid">
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>Total MCQs</span><span className="badge badge-teal">Bank</span></div><strong>{totalMcqs}</strong><small>Live count from uploaded subject banks</small></div>
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>Total Chapters</span><span className="badge badge-purple">Coverage</span></div><strong>{totalChapters}</strong><small>Chapter count across MDCAT subjects</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>Student Attempts</span><span className="badge badge-amber">Active</span></div><strong>{summary.totalAttempts}</strong><small>Real chapter submissions from students</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>Average Score</span><span className="badge badge-coral">Class</span></div><strong>{summary.classAverage}%</strong><small>Average across recorded submissions</small></div>
      </div>

      <section className="workspace-card">
        <div className="workspace-card-head">
            <div>
              <div className="label-xs">Assigned MDCAT Subject Banks</div>
              <h3 className="workspace-card-title">Teacher access is limited to assigned subjects</h3>
            <p>Only approved subjects are shown for management, analytics, and student attempt tracking.</p>
            </div>
        </div>
        <div className="workspace-card-body">
          <div className="card-grid">
            {visibleSubjects.map((subject) => {
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
            {visibleTeacherSummary.map((item) => (
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
            {dashboardStudents.map((student) => (
              <div key={student.name} className="timeline-item">
                <div className="timeline-dot" style={{ background: student.risk === 'High' ? 'var(--coral)' : student.risk === 'Medium' ? 'var(--amber)' : 'var(--teal)' }} />
                <div>
                  <strong>{student.name}</strong>
                  <p>{student.city} - Current score {student.score}% - {student.streak}</p>
                  <small>Risk profile: {student.risk}</small>
                </div>
              </div>
            ))}
            {dashboardStudents.length === 0 ? (
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
  const { subjects = [] } = useMcqSubjectSummary()
  const { overview = {}, recentStudents = [] } = useAdminPanelData()
  const safeSubjects = Array.isArray(subjects) ? subjects : []
  const safeRecentStudents = Array.isArray(recentStudents) ? recentStudents : []
  const subjectMix = safeSubjects.map((subject) => ({
    name: subject.name,
    value: Number(subject.totalMcqs) || 0,
    fill: subject.name === 'Biology' ? '#1db884' : subject.name === 'Chemistry' ? '#6c47ff' : subject.name === 'Physics' ? '#4a90e2' : '#f59e0b',
  }))

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-hero workspace-hero--amber">
        <div className="workspace-hero-grid">
          <div className="workspace-hero-copy">
            <div className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Admin Dashboard</div>
            <h1 style={{ color: '#fff' }}>Control student access, subscriptions, and MCQ quality from one admin workspace</h1>
            <p>Phase 1 is focused on operations: student access, subscription visibility, payment follow-up, and live MCQ coverage across Biology, Chemistry, Physics, and English.</p>
          </div>
          <div className="workspace-hero-stats">
            <div className="hero-mini-card"><span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Active Subscriptions</span><strong>{overview.activeSubscriptions}</strong><p>Students with current paid access</p></div>
            <div className="hero-mini-card"><span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Pending Payments</span><strong>{overview.pendingPayments}</strong><p>Manual payment follow-up queue</p></div>
          </div>
        </div>
      </section>

      <div className="card-grid">
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>Total Students</span><span className="badge badge-purple">Live</span></div><strong>{overview.totalStudents}</strong><small>{overview.activeStudents} active accounts</small></div>
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>Active Subscriptions</span><span className="badge badge-teal">Billing</span></div><strong>{overview.activeSubscriptions}</strong><small>{overview.expiringSoon} expiring within 7 days</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>Total Attempts</span><span className="badge badge-amber">Usage</span></div><strong>{overview.totalAttempts}</strong><small>Real chapter submissions from students</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>Monthly Revenue</span><span className="badge badge-coral">Cashflow</span></div><strong>Rs {overview.monthlyRevenue || 0}</strong><small>{overview.pendingPayments} payments still pending review</small></div>
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
          <div className="workspace-card-head"><div><div className="label-xs">Student Access</div><h3 className="workspace-card-title">Newest student accounts</h3></div></div>
          <div className="workspace-card-body list-stack">
            {safeRecentStudents.map((student) => (
              <div key={student._id} className="queue-card">
                <div className="workspace-card-title-row">
                  <strong>{student.firstName} {student.lastName}</strong>
                  <span className={`state-chip ${student.accessStatus === 'active' ? 'state-chip--success' : student.accessStatus === 'restricted' ? 'state-chip--warning' : 'state-chip--neutral'}`}>{student.accessStatus}</span>
                </div>
                <p>{student.email} - {student.subscriptionPlan} plan - {student.metrics?.totalTests || 0} tests</p>
              </div>
            ))}
            {safeRecentStudents.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No students yet</h3>
                <p>New student accounts and access states will appear here after registration begins.</p>
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













