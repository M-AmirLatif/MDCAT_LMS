import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import useAdminPanelData from '../hooks/useAdminPanelData'
import useTeacherAnalyticsData from '../hooks/useTeacherAnalyticsData'
import useThemeMode from '../hooks/useThemeMode'
import './PlatformPages.css'
import {
  adminTransactions,
  permissionMatrix,
  superAdminLogs,
  teacherAssignments,
} from './platformContent'

const scoreDistribution = []
const multiStudentTrend = []
const PLAN_OPTIONS = ['free', 'monthly', 'quarterly', 'premium', 'enterprise']
const SUBSCRIPTION_OPTIONS = ['none', 'pending', 'active', 'expired', 'cancelled']
const ACCESS_OPTIONS = ['active', 'restricted', 'expired']
const cleanTooltipStyle = (chartTheme) => ({
  background: '#fbfaff',
  color: '#19172e',
  border: '1px solid rgba(124, 92, 255, 0.14)',
  borderRadius: 14,
  boxShadow: chartTheme.isDark ? '0 20px 48px rgba(0, 0, 0, 0.38)' : '0 18px 42px rgba(42,51,86,0.16)',
})

function ChartTooltip({ active, label, payload, chartTheme, valueSuffix = '', valueLabel = 'Value' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip-clean" style={cleanTooltipStyle(chartTheme)}>
      <div className="chart-tooltip-clean__label">{label}</div>
      {payload
        .filter((entry) => entry.value !== null && typeof entry.value !== 'undefined')
        .map((entry) => (
          <div className="chart-tooltip-clean__row" key={`${entry.name}-${entry.dataKey}`}>
            <span className="chart-tooltip-clean__dot" style={{ background: entry.color || entry.stroke || entry.fill }} />
            <span>{entry.dataKey === 'count' ? valueLabel : entry.name || valueLabel}</span>
            <strong>{Math.round(Number(entry.value) || 0)}{valueSuffix}</strong>
          </div>
        ))}
    </div>
  )
}

const formatTeacherSubjects = (teacher) => {
  const subjects = Array.isArray(teacher?.assignedSubjects) && teacher.assignedSubjects.length
    ? teacher.assignedSubjects
    : teacher?.assignedSubject
      ? [teacher.assignedSubject]
      : []
  return subjects.length ? subjects.join(', ') : 'No subject'
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

const formatTitle = (value = '') =>
  String(value || '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const formatDate = (value) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleDateString()
}

export function TeacherStudentsPage() {
  const chartTheme = useThemeMode()
  const { studentRows, loading } = useTeacherAnalyticsData()
  const selectedStudent = studentRows[0] || null

  return (
    <div className="workspace-page workspace-page--teacher-students animate-fade-up">
      <section className="workspace-card teacher-students-hero-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Student Attempts</div>
            <h2 className="workspace-card-title">Track chapter performance and intervene fast</h2>
          </div>
        </div>
        <div className="workspace-card-body">
          <div className="filter-pills teacher-students-filter-pills">
            <button className="filter-pill filter-pill--active" type="button">All</button>
            <button className="filter-pill" type="button">At Risk</button>
            <button className="filter-pill" type="button">Top Performers</button>
            <button className="filter-pill" type="button">Needs Contact</button>
          </div>
        </div>
      </section>

      <div className="split-layout">
        <div className="workspace-card teacher-students-list-card">
          <div className="workspace-card-body">
            <table className="simple-table teacher-students-table">
              <thead>
                <tr><th>Name</th><th>City</th><th>Score</th><th>Streak</th><th>Risk</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                        <div className="loading-spinner"></div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', margin: 0 }}>Loading student rows...</p>
                      </div>
                    </td>
                  </tr>
                ) : studentRows.length > 0 ? (
                  studentRows.map((student) => (
                    <tr key={student.name}>
                      <td data-label="Name">{student.name}</td>
                      <td data-label="City">{student.city}</td>
                      <td data-label="Score">{student.score}%</td>
                      <td data-label="Streak">{student.streak}</td>
                      <td data-label="Risk">{student.risk}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state empty-state--compact">
                        <div className="empty-orb" />
                        <h3>No students yet</h3>
                        <p>Student rows will appear after real learners start practicing.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="workspace-card drawer-card teacher-students-detail-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Student Detail</div>
              <h3 className="workspace-card-title">{selectedStudent?.name || 'No student selected'}</h3>
            </div>
          </div>
          <div className="workspace-card-body">
            <div className="chart-panel" style={{ height: '180px' }}>
              {selectedStudent ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedStudent.trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.gridColor} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: chartTheme.axisColor, fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: chartTheme.axisColor, fontSize: 12 }} />
                    <Tooltip cursor={{ stroke: '#7c5cff', strokeOpacity: 0.22 }} formatter={(value) => [`${Math.round(Number(value) || 0)}%`, 'Score']} contentStyle={{ background: chartTheme.tooltipBg, color: chartTheme.tooltipText, border: 'none', borderRadius: 14, boxShadow: chartTheme.isDark ? '0 18px 42px rgba(0,0,0,0.42)' : '0 18px 42px rgba(42,51,86,0.16)' }} labelStyle={{ color: chartTheme.tooltipText, fontWeight: 800 }} />
                    <Line type="monotone" dataKey="score" stroke="#7c5cff" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            <div className="metric-row"><span>Email</span><strong>{selectedStudent?.email || 'No student selected'}</strong></div>
            <div className="metric-row"><span>Action</span><div className="inline-actions"><button className="btn btn-secondary btn-sm" type="button">Contact</button><button className="btn btn-ghost btn-sm" type="button">Assign Work</button></div></div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function TeacherAssignmentsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">MCQ Builder</div><h2 className="workspace-card-title">Create and review chapter based MCQ entries</h2></div></div>
        <div className="workspace-card-body">
          <div className="filter-pills">
            <button className="filter-pill filter-pill--active" type="button">Active Bank</button>
            <button className="filter-pill" type="button">Drafts</button>
            <button className="filter-pill" type="button">Reviewed</button>
          </div>
        </div>
      </section>

      <div className="workspace-columns-3">
        {teacherAssignments.map((assignment) => (
          <div key={assignment.title} className="assignment-row" style={{ display: 'block' }}>
            <div className="workspace-card-title-row">
              <strong>{assignment.title}</strong>
              <span className={`state-chip ${assignment.status === 'Active' ? 'state-chip--warning' : assignment.status === 'Submitted' ? 'state-chip--neutral' : 'state-chip--success'}`}>{assignment.status}</span>
            </div>
            <p>{assignment.submissions} practice attempts • Updated {assignment.due}</p>
          </div>
        ))}
        {teacherAssignments.length === 0 ? (
          <div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No MCQ work yet</h3><p>Created chapters and MCQs will appear here after teachers save real content.</p></div>
        ) : null}
      </div>

      <div className="split-layout">
        <section className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">MCQ Entry</div><h3 className="workspace-card-title">Question builder</h3></div></div>
          <div className="workspace-card-body">
            <p><strong>Question:</strong> No MCQ selected.</p>
            <div className="workspace-card" style={{ marginTop: '16px' }}>
              <div className="workspace-card-body">
                <p>Options will appear after a real MCQ is selected or created.</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Explanation</div><h3 className="workspace-card-title">Save final MCQ</h3></div></div>
          <div className="workspace-card-body form-shell">
            <div className="floating-field"><label htmlFor="score">Correct Option</label><input id="score" type="text" placeholder="A, B, C, or D" /></div>
            <div className="floating-field"><label htmlFor="feedback">Explanation</label><textarea id="feedback" placeholder="Write the real explanation for the selected MCQ." rows="5" /></div>
            <button className="btn btn-primary" type="button">Save MCQ</button>
          </div>
        </aside>
      </div>
    </div>
  )
}


function TeacherScoreDistributionChart({ data }) {
  const maxCount = Math.max(1, ...data.map((item) => Number(item.count) || 0))

  return (
    <div className="teacher-simple-bars" role="img" aria-label="Score distribution chart">
      {data.map((item) => {
        const count = Number(item.count) || 0
        const height = Math.max(8, Math.round((count / maxCount) * 100))
        return (
          <div key={item.band} className="teacher-simple-bar-item">
            <div className="teacher-simple-bar-track">
              <div className="teacher-simple-bar-fill" style={{ height: `${height}%` }} />
            </div>
            <strong>{count}</strong>
            <span>{item.band}</span>
          </div>
        )
      })}
    </div>
  )
}

function TeacherMultiStudentChart({ data, lines }) {
  const width = 560
  const height = 330
  const padding = { top: 30, right: 24, bottom: 70, left: 58 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const colors = ['#6c47ff', '#ff5f72', '#15b886', '#2f80ed', '#f59e0b']
  const xTickEvery = Math.max(1, Math.ceil(data.length / 5))

  const getPoints = (lineKey) => data
    .map((item, index) => ({
      value: Number(item[lineKey]),
      index,
      label: item.label,
    }))
    .filter((point) => Number.isFinite(point.value))
    .map((point) => ({
      ...point,
      x: padding.left + (data.length > 1 ? (point.index / (data.length - 1)) * plotWidth : plotWidth / 2),
      y: padding.top + plotHeight - (Math.max(0, Math.min(100, point.value)) / 100) * plotHeight,
    }))

  const toSmoothPath = (points) => {
    if (points.length < 2) return ''
    return points.reduce((path, point, index, all) => {
      if (index === 0) return `M ${point.x} ${point.y}`
      const previous = all[index - 1]
      const controlX = previous.x + (point.x - previous.x) / 2
      return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
    }, '')
  }

  return (
    <div className="teacher-svg-chart" role="img" aria-label="Multi-student line chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padding.top + plotHeight - (tick / 100) * plotHeight
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="teacher-svg-grid" />
              <text x={padding.left - 16} y={y + 5} textAnchor="end" className="teacher-svg-axis teacher-svg-axis-y">{tick}%</text>
            </g>
          )
        })}
        <line x1={padding.left} x2={width - padding.right} y1={padding.top + plotHeight} y2={padding.top + plotHeight} className="teacher-svg-axis-line" />
        {data.map((item, index) => {
          if (index % xTickEvery !== 0 && index !== data.length - 1) return null
          const x = padding.left + (data.length > 1 ? (index / (data.length - 1)) * plotWidth : plotWidth / 2)
          return (
            <text key={`${item.label}-${index}`} x={x} y={height - 28} textAnchor="middle" className="teacher-svg-axis teacher-svg-axis-x">
              {item.label}
            </text>
          )
        })}
        {lines.map((lineKey, lineIndex) => {
          const points = getPoints(lineKey)
          const path = toSmoothPath(points)
          return (
            <g key={lineKey}>
              {points.length > 1 ? (
                <path
                  d={path}
                  fill="none"
                  stroke={colors[lineIndex % colors.length]}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="teacher-svg-line"
                />
              ) : null}
              {points.map((point) => (
                <circle
                  key={`${lineKey}-${point.index}`}
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill={colors[lineIndex % colors.length]}
                  stroke="#fff"
                  strokeWidth="3"
                  className="teacher-svg-point"
                />
              ))}
            </g>
          )
        })}
      </svg>
      <div className="teacher-svg-legend">
        {lines.map((lineKey, index) => (
          <span key={lineKey}><i style={{ background: colors[index % colors.length] }} />{lineKey}</span>
        ))}
      </div>
    </div>
  )
}

export function TeacherAnalyticsPage() {
  const { user } = useAuth()
  const { summary, scoreDistribution, subjectMastery, multiStudentTrend, loading } = useTeacherAnalyticsData()

  const [topFailed, setTopFailed] = React.useState([])
  const [csvData, setCsvData] = React.useState([])
  
  React.useEffect(() => {
    fetch('/api/mcqs/teacher/analytics', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => res.json()).then(data => {
      if (data.topFailed) setTopFailed(data.topFailed)
      if (data.csvData) setCsvData(data.csvData)
    }).catch(err => console.error(err))
  }, [])

  const downloadCsv = () => {
    if (!csvData.length) return alert('No data to export');
    const headers = 'Student Name,Email,Chapter,Score,Percentage,Date\n';
    const rows = csvData.map(r => `"${r.studentName}","${r.studentEmail}","${r.chapter}","${r.score}","${r.percentage}%","${new Date(r.date).toLocaleDateString()}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher_analytics.csv';
    a.click();
  }
  const teacherSubjects = getAssignedSubjectNames(user)
  const visibleSubjectMastery = teacherSubjects.length
    ? subjectMastery.filter((item) => teacherSubjects.includes(item.subject))
    : subjectMastery
  const trendLines = multiStudentTrend.length > 0
    ? Object.keys(multiStudentTrend.reduce((merged, item) => ({ ...merged, ...item }), {})).filter((key) => key !== 'label')
    : []
  const hasDistribution = scoreDistribution.some((item) => item.count > 0)
  const hasTrend = trendLines.length > 0

  return (
    <div className="workspace-page animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={downloadCsv}>⬇ Export Analytics to CSV</button>
      </div>
      
      {topFailed.length > 0 && (
        <section className="workspace-card" style={{ marginBottom: '30px' }}>
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Critical Review</div>
              <h2 className="workspace-card-title">Top 5 Most Failed MCQs</h2>
              <p>These questions have the highest failure rates in your assigned subject.</p>
            </div>
          </div>
          <div className="workspace-card-body" style={{ padding: '20px' }}>
            {topFailed.map((item, index) => (
              <div key={item.id} style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.2rem', color: '#ef4444' }}>#{index + 1}</strong>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{item.questionText}</p>
                </div>
                <div style={{ textAlign: 'center', background: '#fee2e2', padding: '8px 16px', borderRadius: '8px' }}>
                  <strong style={{ color: '#ef4444', display: 'block' }}>{item.failCount}</strong>
                  <small style={{ color: '#b91c1c' }}>Fails</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="card-grid">
        <div className="stat-tile"><span>Class Average</span><strong>{loading ? '...' : `${summary.classAverage}%`}</strong></div>
        <div className="stat-tile"><span>Submission Rate</span><strong>{loading ? '...' : `${summary.submissionRate}%`}</strong></div>
        <div className="stat-tile"><span>Live Attendance</span><strong>{loading ? '...' : `${summary.liveAttendance}%`}</strong></div>
        <div className="stat-tile"><span>At Risk</span><strong>{loading ? '...' : summary.atRisk}</strong></div>
      </div>

      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Distribution</div><h2 className="workspace-card-title">Score distribution</h2></div></div>
          <div className="workspace-card-body chart-panel teacher-analytics-chart teacher-score-chart">
            {hasDistribution ? (
              <TeacherScoreDistributionChart data={scoreDistribution} />
            ) : (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No submissions yet</h3>
                <p>Score distribution will appear after students attempt your MCQ banks.</p>
              </div>
            )}
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Heatmap</div><h3 className="workspace-card-title">Subject mastery</h3></div></div>
          <div className="workspace-card-body heatmap-grid">
            {visibleSubjectMastery.map((item) => (
              <div
                key={item.subject}
                className="heat-cell"
                style={{
                  background:
                    item.subject === 'Biology'
                      ? '#1db884'
                      : item.subject === 'Physics'
                        ? '#4a90e2'
                        : item.subject === 'Chemistry'
                          ? '#f59e0b'
                          : '#6c47ff',
                }}
              >
                <span>{item.subject}</span>
                <strong>{item.score}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Comparison</div><h3 className="workspace-card-title">Multi-student line chart</h3></div></div>
        <div className="workspace-card-body chart-panel teacher-analytics-chart teacher-multi-chart">
          {hasTrend ? (
            <TeacherMultiStudentChart data={multiStudentTrend} lines={trendLines} />
          ) : (
            <div className="empty-state empty-state--compact">
              <div className="empty-orb" />
              <h3>No multi-student trend yet</h3>
              <p>Student comparison will appear after multiple attempts are recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminStudentsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [savingField, setSavingField] = useState('')
  const { overview, students, loadingStudents, loadingOverview, error, updateUser } = useAdminPanelData({
    includeStudents: true,
    search,
  })

  const visibleStudents = useMemo(() => {
    return students.filter((student) => {
      if (filter === 'all') return true
      if (filter === 'active') return student.accessStatus === 'active' && student.isActive
      if (filter === 'restricted') return student.accessStatus === 'restricted' || !student.isActive
      if (filter === 'expiring') {
        if (!student.subscriptionEndDate) return false
        const expiry = new Date(student.subscriptionEndDate)
        const now = new Date()
        const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        return expiry >= now && expiry <= weekAhead
      }
      return true
    })
  }, [filter, students])

  const selectedStudent =
    visibleStudents.find((student) => student._id === selectedId) ||
    visibleStudents[0] ||
    null

  const saveStudentField = async (studentId, payload, fieldKey) => {
    try {
      setSavingField(`${studentId}:${fieldKey}`)
      await updateUser(studentId, payload)
    } finally {
      setSavingField('')
    }
  }

  return (
    <div className="workspace-page admin-students-page animate-fade-up">
      <div className="card-grid">
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>Total Students</span><span className="badge badge-purple">Live</span></div><strong>{loadingOverview ? '...' : overview.totalStudents}</strong><small>{loadingOverview ? '...' : overview.activeStudents} active accounts</small></div>
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>Paid Access</span><span className="badge badge-teal">Plans</span></div><strong>{loadingOverview ? '...' : overview.activeSubscriptions}</strong><small>Current active subscriptions</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>Expiring Soon</span><span className="badge badge-amber">7 Days</span></div><strong>{loadingOverview ? '...' : overview.expiringSoon}</strong><small>Students needing renewal follow-up</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>Restricted</span><span className="badge badge-coral">Access</span></div><strong>{loadingOverview ? '...' : overview.restrictedStudents}</strong><small>Accounts requiring admin action</small></div>
      </div>

      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Manage Students</div><h2 className="workspace-card-title">Enrollment and access control</h2></div></div>
        <div className="workspace-card-body">
          <div className="split-toolbar">
            <div className="filter-pills">
              <button className={`filter-pill ${filter === 'all' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('all')} type="button">All</button>
              <button className={`filter-pill ${filter === 'active' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('active')} type="button">Active</button>
              <button className={`filter-pill ${filter === 'expiring' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('expiring')} type="button">Expiring</button>
              <button className={`filter-pill ${filter === 'restricted' ? 'filter-pill--active' : ''}`} onClick={() => setFilter('restricted')} type="button">Restricted</button>
            </div>
            <div className="floating-field student-search-field">
              <label htmlFor="student-search">Search students</label>
              <input id="student-search" type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" />
            </div>
          </div>
          {error ? <p className="error-message">{error}</p> : null}
        </div>
      </div>

      <div className="split-layout">
        <div className="workspace-card admin-table-card">
          <div className="workspace-card-body">
            <table className="simple-table">
              <thead>
                <tr><th>Name</th><th>Plan</th><th>Subscription</th><th>Access</th><th>Tests</th><th>Action</th></tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => (
                  <tr key={student._id} className={selectedStudent?._id === student._id ? 'table-row-active' : ''} onClick={() => setSelectedId(student._id)}>
                    <td>
                      <div className="table-primary-cell">
                        <strong>{student.firstName} {student.lastName}</strong>
                        <small>{student.email}</small>
                      </div>
                    </td>
                    <td>
                      <select value={student.subscriptionPlan || 'free'} onChange={(event) => saveStudentField(student._id, { subscriptionPlan: event.target.value }, 'plan')}>
                        {PLAN_OPTIONS.map((option) => <option key={option} value={option}>{formatTitle(option)}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={student.subscriptionStatus || 'none'} onChange={(event) => saveStudentField(student._id, { subscriptionStatus: event.target.value }, 'subscription')}>
                        {SUBSCRIPTION_OPTIONS.map((option) => <option key={option} value={option}>{formatTitle(option)}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={student.accessStatus || 'active'} onChange={(event) => saveStudentField(student._id, { accessStatus: event.target.value }, 'access')}>
                        {ACCESS_OPTIONS.map((option) => <option key={option} value={option}>{formatTitle(option)}</option>)}
                      </select>
                    </td>
                    <td>{student.metrics?.totalTests || 0}</td>
                    <td>
                      <div className="inline-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            saveStudentField(student._id, { isActive: !student.isActive }, 'account')
                          }}
                          disabled={savingField === `${student._id}:account`}
                        >
                          {student.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loadingStudents && visibleStudents.length === 0 ? (
                  <tr><td colSpan="6"><div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No students found</h3><p>Student accounts will appear here after registrations and payments start.</p></div></td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="workspace-card drawer-card admin-detail-card">
          <div className="workspace-card-head"><div><div className="label-xs">Student Detail</div><h3 className="workspace-card-title">{selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'No student selected'}</h3></div></div>
          <div className="workspace-card-body list-stack">
            <div className="metric-row"><span>Email</span><strong>{selectedStudent?.email || 'No student selected'}</strong></div>
            <div className="metric-row"><span>Plan</span><strong>{formatTitle(selectedStudent?.subscriptionPlan || 'free')}</strong></div>
            <div className="metric-row"><span>Subscription</span><strong>{formatTitle(selectedStudent?.subscriptionStatus || 'none')}</strong></div>
            <div className="metric-row"><span>Access</span><strong>{formatTitle(selectedStudent?.accessStatus || 'active')}</strong></div>
            <div className="metric-row"><span>Tests Attempted</span><strong>{selectedStudent?.metrics?.totalTests || 0}</strong></div>
            <div className="metric-row"><span>Average Score</span><strong>{selectedStudent?.metrics?.averageScore || 0}%</strong></div>
            <div className="metric-row"><span>Total Paid</span><strong>Rs {selectedStudent?.metrics?.totalPaidAmount || 0}</strong></div>
            <div className="metric-row"><span>Last Attempt</span><strong>{formatDate(selectedStudent?.metrics?.lastAttemptAt)}</strong></div>
            <div className="metric-row"><span>Plan Ends</span><strong>{formatDate(selectedStudent?.subscriptionEndDate)}</strong></div>
            <div className="metric-row"><span>Joined</span><strong>{formatDate(selectedStudent?.createdAt)}</strong></div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function AdminTeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const endpoint = statusFilter === 'pending' ? '/admin/teachers/pending' : '/admin/teachers/all'
      const res = await API.get(endpoint, {
        params: statusFilter !== 'all' && statusFilter !== 'pending' ? { status: statusFilter } : {},
      })
      setTeachers(res.data.teachers || [])
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'We could not load teacher requests.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const approve = async (teacher) => {
    setSavingId(teacher._id)
    try {
      await API.patch(`/admin/teachers/${teacher._id}/approve`)
      toast.success('Teacher approved.')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Could not approve teacher.'))
    } finally {
      setSavingId('')
    }
  }

  const reject = async (teacher) => {
    const rejectionReason = window.prompt('Optional rejection reason:', teacher.rejectionReason || '')
    if (rejectionReason === null) return
    setSavingId(teacher._id)
    try {
      await API.patch(`/admin/teachers/${teacher._id}/reject`, { rejectionReason })
      toast.success('Teacher rejected.')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Could not reject teacher.'))
    } finally {
      setSavingId('')
    }
  }

  const restrict = async (teacher) => {
    const restrictionReason = window.prompt('Optional restriction reason:', teacher.rejectionReason || '')
    if (restrictionReason === null) return
    setSavingId(teacher._id)
    try {
      await API.patch(`/admin/teachers/${teacher._id}/restrict`, { restrictionReason })
      toast.success('Teacher restricted.')
      load()
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error, 'Could not restrict teacher.'))
    } finally {
      setSavingId('')
    }
  }

  const selectedTeacher = teachers[0] || null

  return (
    <div className="workspace-page admin-teachers-page animate-fade-up">
      <div className="split-layout admin-split-layout">
        <div className="workspace-card admin-teacher-queue-card">
          <div className="workspace-card-head">
            <div><div className="label-xs">Teacher Queue</div><h2 className="workspace-card-title">Pending teacher approvals</h2></div>
            <div className="filter-pills">
              {['pending', 'all', 'active', 'restricted', 'rejected'].map((status) => (
                <button key={status} className={`filter-pill ${statusFilter === status ? 'filter-pill--active' : ''}`} type="button" onClick={() => setStatusFilter(status)}>{formatTitle(status)}</button>
              ))}
            </div>
          </div>
          <div className="workspace-card-body list-stack">
            {loading ? <div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>Loading teachers...</h3></div> : null}
            {!loading && teachers.map((teacher) => (
              <div key={teacher._id} className="queue-card">
                <div className="workspace-card-title-row">
                  <strong>{teacher.firstName} {teacher.lastName}</strong>
                  <span className={`state-chip ${teacher.status === 'active' ? 'state-chip--success' : teacher.status === 'rejected' || teacher.status === 'restricted' ? 'state-chip--warning' : 'state-chip--neutral'}`}>{formatTitle(teacher.status)}</span>
                </div>
                <p>{teacher.email} - {formatTeacherSubjects(teacher)} - Registered {formatDate(teacher.createdAt)}</p>
                <div className="inline-actions">
                  {teacher.status === 'pending' ? (
                    <>
                      <button className="btn btn-primary btn-sm" type="button" disabled={savingId === teacher._id} onClick={() => approve(teacher)}>Approve</button>
                      <button className="btn btn-ghost btn-sm" type="button" disabled={savingId === teacher._id} onClick={() => reject(teacher)}>Reject</button>
                    </>
                  ) : teacher.status === 'active' ? (
                    <>
                      <button className="btn btn-danger btn-sm" type="button" disabled={savingId === teacher._id} onClick={() => restrict(teacher)}>Restrict</button>
                      <span className="state-chip state-chip--neutral">{formatTeacherSubjects(teacher)}</span>
                    </>
                  ) : teacher.status === 'restricted' || teacher.status === 'rejected' ? (
                    <>
                      <button className="btn btn-primary btn-sm" type="button" disabled={savingId === teacher._id} onClick={() => approve(teacher)}>Approve Again</button>
                      <span className="state-chip state-chip--neutral">{formatTeacherSubjects(teacher)}</span>
                    </>
                  ) : (
                    <span className="state-chip state-chip--neutral">{formatTeacherSubjects(teacher)}</span>
                  )}
                </div>
              </div>
            ))}
            {!loading && teachers.length === 0 ? (
              <div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No teachers yet</h3><p>Teacher accounts and approvals will appear here.</p></div>
            ) : null}
          </div>
        </div>

        <aside className="workspace-card drawer-card admin-detail-card">
          <div className="workspace-card-head"><div><div className="label-xs">Teacher Detail</div><h3 className="workspace-card-title">{selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : 'No teacher selected'}</h3></div></div>
          <div className="workspace-card-body list-stack">
            <div className="metric-row"><span>Email</span><strong>{selectedTeacher?.email || 'No data'}</strong></div>
            <div className="metric-row"><span>Approval status</span><strong>{formatTitle(selectedTeacher?.status || 'No data')}</strong></div>
            <div className="metric-row"><span>Assigned subjects</span><strong>{formatTeacherSubjects(selectedTeacher)}</strong></div>
            <div className="metric-row"><span>Registered</span><strong>{formatDate(selectedTeacher?.createdAt)}</strong></div>
            {selectedTeacher?.status === 'pending' ? (
              <button className="btn btn-amber" type="button" disabled={savingId === selectedTeacher._id} onClick={() => approve(selectedTeacher)}>Approve Teacher</button>
            ) : null}
            {selectedTeacher?.status === 'active' ? (
              <button className="btn btn-danger" type="button" disabled={savingId === selectedTeacher._id} onClick={() => restrict(selectedTeacher)}>Restrict Teacher</button>
            ) : null}
            {selectedTeacher?.status === 'restricted' || selectedTeacher?.status === 'rejected' ? (
              <button className="btn btn-primary" type="button" disabled={savingId === selectedTeacher._id} onClick={() => approve(selectedTeacher)}>Approve Again</button>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
export function AdminCoursesPage() {
  return (
    <div className="workspace-page admin-courses-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">MCQ Moderation</div><h2 className="workspace-card-title">Edit chapter metadata and moderate question quality</h2></div></div>
        <div className="workspace-card-body form-shell">
          <div className="floating-grid">
            <div className="floating-field"><label htmlFor="course-name">Subject</label><select id="course-name" defaultValue=""><option value="">Select subject</option><option>Biology</option><option>Chemistry</option><option>Physics</option><option>English</option></select></div>
            <div className="floating-field"><label htmlFor="teacher">Assigned Teacher</label><select id="teacher" defaultValue=""><option value="">Select real teacher</option></select></div>
          </div>
          <div className="floating-field"><label htmlFor="description">Moderation Notes</label><textarea id="description" rows="6" placeholder="Add moderation notes for a real teacher upload." /></div>
          <div className="metric-row"><span>Publish toggle</span><span className="toggle toggle--on" /></div>
          <div className="inline-actions"><button className="btn btn-primary" type="button">Save Changes</button><button className="btn btn-ghost" type="button">Archive Question</button></div>
        </div>
      </section>
    </div>
  )
}

export function AdminAnnouncementsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Announcements</div><h2 className="workspace-card-title">Targeted broadcast composer</h2></div></div>
        <div className="workspace-card-body form-shell">
          <div className="chip-list">
            <span className="variable-chip">Students</span>
            <span className="variable-chip">Teachers</span>
            <span className="variable-chip">Admins</span>
          </div>
          <div className="floating-field"><label htmlFor="announcement-title">Title</label><input id="announcement-title" type="text" placeholder="Enter announcement title" /></div>
          <div className="floating-field"><label htmlFor="announcement-body">Message</label><textarea id="announcement-body" rows="6" placeholder="Write a real announcement before publishing." /></div>
          <div className="floating-grid">
            <div className="floating-field"><label htmlFor="schedule">Schedule</label><input id="schedule" type="datetime-local" /></div>
            <div className="floating-field"><label htmlFor="channel">Channel Mix</label><select id="channel" defaultValue=""><option value="">Select channels</option><option>Push + Email + In-App</option><option>Push only</option></select></div>
          </div>
          <button className="btn btn-primary" type="button">Publish Announcement</button>
        </div>
      </section>
    </div>
  )
}

export function AdminReportsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="report-grid">
        {['Enrollment', 'Revenue', 'Attendance', 'Performance', 'Refunds'].map((report) => (
          <div key={report} className="report-card workspace-card">
            <div className="label-xs">{report}</div>
            <h3 className="workspace-card-title">{report} Report</h3>
            <p>Generate PDF or CSV output for management review.</p>
            <div className="inline-actions">
              <button className="btn btn-primary btn-sm" type="button">Generate</button>
              <button className="btn btn-ghost btn-sm" type="button">Download CSV</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminSettingsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="settings-grid">
        <section className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Branding</div><h3 className="workspace-card-title">Platform identity</h3></div></div>
          <div className="workspace-card-body form-shell">
            <div className="floating-field"><label htmlFor="brand-name">Brand Name</label><input id="brand-name" type="text" defaultValue="MDCAT LMS" /></div>
            <div className="chip-list"><span className="variable-chip">{'{{student_name}}'}</span><span className="variable-chip">{'{{exam_date}}'}</span><span className="variable-chip">{'{{plan_name}}'}</span></div>
          </div>
        </section>
        <section className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Gateways</div><h3 className="workspace-card-title">API keys</h3></div></div>
          <div className="workspace-card-body form-shell">
            <div className="floating-field"><label htmlFor="jazzcash">JazzCash Key</label><input id="jazzcash" type="password" placeholder="Add real gateway key in environment variables" /></div>
            <div className="floating-field"><label htmlFor="easypaisa">EasyPaisa Key</label><input id="easypaisa" type="password" placeholder="Add real gateway key in environment variables" /></div>
            <div className="maintenance-toggle"><div><strong>Maintenance Mode</strong><p>Temporarily limit platform access.</p></div><span className="toggle" /></div>
          </div>
        </section>
      </div>
    </div>
  )
}

export function SuperAdminAdminsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Manage Admins</div><h2 className="workspace-card-title">Roles and permission matrix</h2></div><button className="btn btn-primary" type="button">Invite Admin</button></div>
        <div className="workspace-card-body">
          <table className="simple-table matrix-table">
            <thead><tr><th>Permission</th><th>Student</th><th>Teacher</th><th>Admin</th></tr></thead>
            <tbody>
              {permissionMatrix.map((row) => (
                <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function SuperAdminSettingsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Platform Settings</div><h2 className="workspace-card-title">Feature flags, backups, and role permissions</h2></div></div>
        <div className="workspace-card-body form-shell">
          <div className="maintenance-toggle"><div><strong>Global Maintenance Mode</strong><p>Large red toggle for scheduled downtime and incident response.</p></div><span className="toggle toggle--on" /></div>
          <div className="settings-grid">
            <div className="workspace-card"><div className="workspace-card-body"><strong>Backup / Restore</strong><p>Nightly snapshot retention: 30 days.</p><button className="btn btn-secondary btn-sm" type="button">Run Backup</button></div></div>
            <div className="workspace-card"><div className="workspace-card-body"><strong>API Key Rotation</strong><p>Rotate gateway and internal service secrets.</p><button className="btn btn-danger btn-sm" type="button">Rotate Keys</button></div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SuperAdminLogsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Error Rate</div><h2 className="workspace-card-title">Area chart</h2></div></div>
          <div className="workspace-card-body chart-panel">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{ hour: '18:00', errors: 2 }, { hour: '19:00', errors: 4 }, { hour: '20:00', errors: 7 }, { hour: '21:00', errors: 3 }]}>
                <defs><linearGradient id="logArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.3} /><stop offset="100%" stopColor="#ff6b6b" stopOpacity={0.03} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(108,71,255,0.08)" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="errors" stroke="#ff6b6b" fill="url(#logArea)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Filters</div><h3 className="workspace-card-title">Severity</h3></div></div>
          <div className="workspace-card-body filter-pills">
            <button className="filter-pill filter-pill--active" type="button">All</button>
            <button className="filter-pill" type="button">Critical</button>
            <button className="filter-pill" type="button">Warning</button>
            <button className="filter-pill" type="button">Info</button>
          </div>
        </div>
      </div>

      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Logs</div><h2 className="workspace-card-title">System log stream</h2></div><button className="btn btn-secondary btn-sm" type="button">Export CSV</button></div>
        <div className="workspace-card-body list-stack">
          {superAdminLogs.map((log) => (
            <div key={log.message} className="log-row">
              <span className={`severity-badge ${log.severity === 'Critical' ? 'severity-badge--critical' : log.severity === 'Warning' ? 'severity-badge--warning' : 'severity-badge--info'}`}>{log.severity}</span>
              <div>
                <strong>{log.service}</strong>
                <div className="log-text">{log.message}</div>
                <small>{log.time}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SuperAdminDangerZonePage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="danger-banner">
        <strong>Danger Zone:</strong>
        <span>These actions can affect every user, every course, or the full billing system.</span>
      </div>
      <div className="danger-grid">
        {['Force logout all sessions', 'Disable payment gateway', 'Restore full backup'].map((action) => (
          <div key={action} className="danger-card">
            <h3 className="workspace-card-title">{action}</h3>
            <p>Mandatory checkbox and type-to-confirm flow required before execution.</p>
            <div className="inline-actions">
              <label><input type="checkbox" /> I understand the impact</label>
            </div>
            <div className="floating-field" style={{ marginTop: '16px' }}><label htmlFor={action}>Type CONFIRM</label><input id={action} type="text" defaultValue="" /></div>
            <button className="btn btn-danger" style={{ marginTop: '16px' }} type="button">Open Confirm Modal</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SuperAdminPaymentsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="workspace-columns-3">
        <div className="pricing-card"><div className="label-xs">Master Gateway Control</div><h3 className="workspace-card-title">No gateway data</h3><p>Real payment route health will appear after integration.</p></div>
        <div className="pricing-card"><div className="label-xs">Payout Management</div><h3 className="workspace-card-title">Rs 0 pending</h3><p>Teacher settlements will appear after real revenue starts.</p></div>
        <div className="pricing-card"><div className="label-xs">Refund Escalations</div><h3 className="workspace-card-title">0 open</h3><p>Refund rows will appear after real transactions.</p></div>
      </div>

      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Transactions</div><h3 className="workspace-card-title">All gateway activity</h3></div></div>
        <div className="workspace-card-body">
          <table className="simple-table">
            <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {adminTransactions.map((row) => (
                <tr key={`${row.student}-${row.date}-super`}>
                  <td>{row.student}</td>
                  <td>{row.amount}</td>
                  <td>{row.method}</td>
                  <td>{row.status}</td>
                  <td>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function SuperAdminAnnouncementsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="danger-banner">
        <strong>Emergency Alert:</strong>
        <span>Forced push notification and red banner style for platform-wide incidents.</span>
      </div>
      <section className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Platform-wide Broadcast</div><h2 className="workspace-card-title">Cross-role announcement composer</h2></div></div>
        <div className="workspace-card-body form-shell">
          <div className="chip-list"><span className="variable-chip">Students</span><span className="variable-chip">Teachers</span><span className="variable-chip">Admins</span><span className="variable-chip">Emergency Alert</span></div>
          <div className="floating-field"><label htmlFor="sa-title">Title</label><input id="sa-title" type="text" placeholder="Enter platform-wide alert title" /></div>
          <div className="floating-field"><label htmlFor="sa-body">Message</label><textarea id="sa-body" rows="6" placeholder="Write a real emergency announcement before sending." /></div>
          <button className="btn btn-danger" type="button">Send Emergency Alert</button>
        </div>
      </section>
    </div>
  )
}

export function AdminActivityPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    stats: {
      activeStudentsToday: 0,
      activeStudentsWeek: 0,
      testsToday: 0,
      totalRegistered: 0,
      registeredToday: 0,
    },
    activities: [],
    pagination: { page: 1, limit: 25, total: 0, pages: 1 },
  })
  const [range, setRange] = useState('today')
  const [subject, setSubject] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Student drill-down state
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [studentDetail, setStudentDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchActivity = async () => {
    try {
      setLoading(true)
      const res = await API.get('/admin/student-activity', {
        params: {
          page,
          limit: 25,
          range,
          subject,
          search: search.trim() || undefined,
        },
      })
      if (res.data?.success) {
        setData(res.data)
      }
    } catch (err) {
      toast.error(getUserFriendlyErrorMessage(err, 'Could not fetch student activity.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivity()
  }, [page, range, subject])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchActivity()
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const openStudentDetail = async (studentId) => {
    if (!studentId) return
    setSelectedStudentId(studentId)
    setLoadingDetail(true)
    try {
      const res = await API.get(`/admin/students/${studentId}/activity`)
      if (res.data?.success) {
        setStudentDetail(res.data)
      }
    } catch (err) {
      toast.error(getUserFriendlyErrorMessage(err, 'Failed to load student activity details.'))
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeStudentDetail = () => {
    setSelectedStudentId(null)
    setStudentDetail(null)
  }

  const stats = data.stats || data.metrics || {}
  const activities = data.activities || []
  const pagination = data.pagination || {}

  const formatDateTime = (value) => {
    if (!value) return 'N/A'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'N/A'
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    return `${mins}m ${secs}s`
  }

  return (
    <div className="workspace-page admin-activity-page animate-fade-up">
      {/* Top Stat Grid */}
      <div className="card-grid">
        <div className="stat-tile stat-tile--purple">
          <div className="stat-tile-top">
            <span>Active Students Today</span>
            <span className="badge badge-purple">Live</span>
          </div>
          <strong>{loading && !activities.length ? '...' : stats.activeStudentsToday || 0}</strong>
          <small>{stats.activeStudentsWeek || 0} active in last 7 days</small>
        </div>

        <div className="stat-tile stat-tile--teal">
          <div className="stat-tile-top">
            <span>Tests Solved Today</span>
            <span className="badge badge-teal">Today</span>
          </div>
          <strong>{loading && !activities.length ? '...' : stats.testsToday || 0}</strong>
          <small>Total MCQ sessions submitted today</small>
        </div>

        <div className="stat-tile stat-tile--amber">
          <div className="stat-tile-top">
            <span>New Signups Today</span>
            <span className="badge badge-amber">Registrations</span>
          </div>
          <strong>{loading && !activities.length ? '...' : stats.registeredToday || 0}</strong>
          <small>New student accounts created today</small>
        </div>

        <div className="stat-tile stat-tile--coral">
          <div className="stat-tile-top">
            <span>Total Registered</span>
            <span className="badge badge-coral">All Time</span>
          </div>
          <strong>{loading && !activities.length ? '...' : stats.totalRegistered || 0}</strong>
          <small>Total students on platform</small>
        </div>
      </div>

      {/* Main Activity Controls & Table */}
      <div className="workspace-card">
        <div className="workspace-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="label-xs">Live Student Activity & Audit Logs</div>
            <h2 className="workspace-card-title">Real-Time MCQ & Test Submissions</h2>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => fetchActivity()}
            disabled={loading}
            type="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Activity'}
          </button>
        </div>

        <div className="workspace-card-body">
          <div className="split-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            {/* Date Range Filter Pills */}
            <div className="filter-pills" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className={`filter-pill ${range === 'today' ? 'filter-pill--active' : ''}`}
                onClick={() => { setRange('today'); setPage(1) }}
                type="button"
              >
                Today
              </button>
              <button
                className={`filter-pill ${range === 'yesterday' ? 'filter-pill--active' : ''}`}
                onClick={() => { setRange('yesterday'); setPage(1) }}
                type="button"
              >
                Yesterday
              </button>
              <button
                className={`filter-pill ${range === '7d' ? 'filter-pill--active' : ''}`}
                onClick={() => { setRange('7d'); setPage(1) }}
                type="button"
              >
                Last 7 Days
              </button>
              <button
                className={`filter-pill ${range === '30d' ? 'filter-pill--active' : ''}`}
                onClick={() => { setRange('30d'); setPage(1) }}
                type="button"
              >
                Last 30 Days
              </button>
              <button
                className={`filter-pill ${range === 'all' ? 'filter-pill--active' : ''}`}
                onClick={() => { setRange('all'); setPage(1) }}
                type="button"
              >
                All Time
              </button>
            </div>

            {/* Subject Selector & Search Input */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setPage(1) }}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-surface, #fff)', fontSize: '0.9rem' }}
              >
                <option value="all">All Subjects</option>
                <option value="biology">Biology</option>
                <option value="chemistry">Chemistry</option>
                <option value="physics">Physics</option>
                <option value="english">English</option>
                <option value="flp">Full Length Papers (FLPs)</option>
                <option value="past_paper">Past Papers</option>
              </select>

              <div className="floating-field" style={{ minWidth: 240, margin: 0 }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student, email, topic..."
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', width: '100%', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          {/* Activity Table */}
          {loading && !activities.length ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted, #718096)' }}>
              <p>Loading activity logs...</p>
            </div>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', background: 'rgba(0,0,0,0.02)', borderRadius: 12 }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-heading, #2d3748)', marginBottom: 6 }}>No activity records found</p>
              <p style={{ color: 'var(--text-muted, #718096)', fontSize: '0.9rem' }}>
                {range === 'today' ? 'No students have submitted tests yet today.' : 'Try changing the date range or search query.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="simple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Student Name & Email</th>
                    <th>Subject</th>
                    <th>Chapter / Topic</th>
                    <th>Score / MCQs</th>
                    <th>Accuracy</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((item) => {
                    const pct = Math.round(item.percentage || item.accuracy || 0)
                    const badgeClass = pct >= 70 ? 'badge-teal' : pct >= 50 ? 'badge-amber' : 'badge-coral'
                    return (
                      <tr key={item._id || item.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                          <span style={{ fontWeight: 600 }}>{formatDateTime(item.submittedAt || item.timestamp)}</span>
                        </td>
                        <td>
                          <div className="table-primary-cell">
                            <strong>
                              {item.studentName || `${item.student?.firstName || ''} ${item.student?.lastName || ''}`.trim() || item.studentEmail || item.student?.email || 'Student'}
                            </strong>
                            <small style={{ color: 'var(--text-muted, #718096)' }}>
                              {item.studentEmail || item.student?.email || 'N/A'}
                            </small>
                            {(item.studentCreatedAt || item.student?.createdAt) ? (
                              <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                Joined: {formatDate(item.studentCreatedAt || item.student?.createdAt)}
                              </small>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                            {item.subject || item.course?.category || 'General'}
                          </span>
                        </td>
                        <td>
                          <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.chapterName || item.topic || 'General Practice'}>
                            <strong>{item.chapterName || item.topic || 'General Practice'}</strong>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {item.finalScore ?? item.score ?? 0} / {item.totalQuestions || 0}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            {pct}%
                          </span>
                        </td>
                        <td style={{ fontSize: '0.88rem', color: 'var(--text-muted, #718096)' }}>
                          {formatDuration(item.timeSpentSeconds)}
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-primary"
                            style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: 6 }}
                            onClick={() => openStudentDetail(item.studentId || item.student?._id || item._id)}
                            type="button"
                          >
                            Full Timeline
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted, #718096)' }}>
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total submissions)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.85rem' }}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="btn btn-outline-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.85rem' }}
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Student Drilldown Modal */}
      {selectedStudentId ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={closeStudentDetail}
        >
          <div
            style={{
              background: 'var(--bg-surface, #fff)',
              borderRadius: 16,
              maxWidth: 780,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: 16, marginBottom: 18 }}>
              <div>
                <div className="label-xs">Student Complete Activity Record</div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>
                  {studentDetail?.student?.name || (studentDetail?.student?.firstName ? `${studentDetail.student.firstName} ${studentDetail.student.lastName || ''}`.trim() : studentDetail?.student?.email || 'Student Timeline')}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted, #718096)', fontSize: '0.9rem' }}>
                  {studentDetail?.student?.email || ''} {studentDetail?.student?.createdAt ? `• Registered on: ${formatDateTime(studentDetail.student.createdAt)}` : ''}
                </p>
              </div>
              <button
                onClick={closeStudentDetail}
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1,
                  color: 'var(--text-muted, #718096)',
                }}
              >
                ×
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p>Loading student activity history...</p>
              </div>
            ) : studentDetail ? (
              <div>
                {/* Metric cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <span style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600 }}>Total Tests Taken</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '1.3rem' }}>{studentDetail.metrics?.totalTests || 0}</h4>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                    <span style={{ fontSize: '0.78rem', color: '#14b8a6', fontWeight: 600 }}>Total MCQs Solved</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '1.3rem' }}>{studentDetail.metrics?.totalQuestions || 0}</h4>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>Average Score</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '1.3rem' }}>{Math.round(studentDetail.metrics?.avgPercentage || 0)}%</h4>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>Best Score</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '1.3rem' }}>{studentDetail.metrics?.bestPercentage || 0}%</h4>
                  </div>
                </div>

                {/* Chronological History List */}
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12 }}>
                  All Test Submissions ({studentDetail.history?.length || studentDetail.sessions?.length || 0})
                </h4>

                {(!studentDetail.history?.length && !studentDetail.sessions?.length) ? (
                  <p style={{ color: 'var(--text-muted, #718096)' }}>No test sessions recorded for this student yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
                    {(studentDetail.history || studentDetail.sessions || []).map((session, idx) => (
                      <div
                        key={session._id || session.id || idx}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: '1px solid var(--border-color, #e2e8f0)',
                          background: 'var(--bg-card, #fafafa)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span className="badge badge-purple" style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                              {session.subject || 'Test'}
                            </span>
                            <strong style={{ fontSize: '0.95rem' }}>{session.chapterName || session.topic || 'General MCQs'}</strong>
                          </div>
                          <small style={{ color: 'var(--text-muted, #718096)', fontSize: '0.8rem' }}>
                            📅 {formatDateTime(session.submittedAt)} • Duration: {formatDuration(session.timeSpentSeconds)}
                          </small>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {session.finalScore ?? session.score ?? 0} / {session.totalQuestions || 0} MCQs
                          </span>
                          <span className={`badge ${session.percentage >= 70 ? 'badge-teal' : session.percentage >= 50 ? 'badge-amber' : 'badge-coral'}`}>
                            {session.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
