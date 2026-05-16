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
import { useMemo, useState } from 'react'
import useAdminPanelData from '../hooks/useAdminPanelData'
import useTeacherAnalyticsData from '../hooks/useTeacherAnalyticsData'
import './PlatformPages.css'
import {
  adminTeachers,
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
  const { studentRows, loading } = useTeacherAnalyticsData()
  const selectedStudent = studentRows[0] || null

  return (
    <div className="workspace-page animate-fade-up">
      <section className="workspace-card">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Student Attempts</div>
            <h2 className="workspace-card-title">Track chapter performance and intervene fast</h2>
          </div>
        </div>
        <div className="workspace-card-body">
          <div className="filter-pills">
            <button className="filter-pill filter-pill--active" type="button">All</button>
            <button className="filter-pill" type="button">At Risk</button>
            <button className="filter-pill" type="button">Top Performers</button>
            <button className="filter-pill" type="button">Needs Contact</button>
          </div>
        </div>
      </section>

      <div className="split-layout">
        <div className="workspace-card">
          <div className="workspace-card-body">
            <table className="simple-table">
              <thead>
                <tr><th>Name</th><th>City</th><th>Score</th><th>Streak</th><th>Risk</th></tr>
              </thead>
              <tbody>
                {studentRows.map((student) => (
                  <tr key={student.name}>
                    <td>{student.name}</td>
                    <td>{student.city}</td>
                    <td>{student.score}%</td>
                    <td>{student.streak}</td>
                    <td>{student.risk}</td>
                  </tr>
                ))}
                {!loading && studentRows.length === 0 ? (
                  <tr><td colSpan="5"><div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No students yet</h3><p>Student rows will appear after real learners start practicing.</p></div></td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="workspace-card drawer-card">
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
                  <LineChart data={selectedStudent.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(108,71,255,0.08)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#6c47ff" strokeWidth={3} dot={false} />
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
        <div className="workspace-card-head"><div><div className="label-xs">MCQ Builder</div><h2 className="workspace-card-title">Create and review chapter-wise MCQ entries</h2></div></div>
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

export function TeacherAnalyticsPage() {
  const { summary, scoreDistribution, subjectMastery, multiStudentTrend, loading } = useTeacherAnalyticsData()
  const trendLines = multiStudentTrend.length > 0
    ? Object.keys(multiStudentTrend.reduce((merged, item) => ({ ...merged, ...item }), {})).filter((key) => key !== 'label')
    : []
  const trendColors = ['#6c47ff', '#ff6b6b', '#1db884']

  return (
    <div className="workspace-page animate-fade-up">
      <div className="workspace-columns-4">
        <div className="stat-tile"><span>Class Average</span><strong>{summary.classAverage}%</strong></div>
        <div className="stat-tile"><span>Submission Rate</span><strong>{summary.submissionRate}%</strong></div>
        <div className="stat-tile"><span>Live Attendance</span><strong>{summary.liveAttendance}%</strong></div>
        <div className="stat-tile"><span>At Risk</span><strong>{summary.atRisk}</strong></div>
      </div>

      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Distribution</div><h2 className="workspace-card-title">Score distribution</h2></div></div>
          <div className="workspace-card-body chart-panel">
            {!loading && scoreDistribution.some((item) => item.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(108,71,255,0.08)" />
                  <XAxis dataKey="band" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1db884" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
            {subjectMastery.map((item) => (
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
        <div className="workspace-card-body chart-panel">
          {!loading && trendLines.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={multiStudentTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(108,71,255,0.08)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {trendLines.map((lineKey, index) => (
                  <Line key={lineKey} type="monotone" dataKey={lineKey} stroke={trendColors[index % trendColors.length]} strokeWidth={3} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
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
  const { overview, students, loadingStudents, error, updateUser } = useAdminPanelData({
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
    <div className="workspace-page animate-fade-up">
      <div className="workspace-columns-4">
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>Total Students</span><span className="badge badge-purple">Live</span></div><strong>{overview.totalStudents}</strong><small>{overview.activeStudents} active accounts</small></div>
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>Paid Access</span><span className="badge badge-teal">Plans</span></div><strong>{overview.activeSubscriptions}</strong><small>Current active subscriptions</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>Expiring Soon</span><span className="badge badge-amber">7 Days</span></div><strong>{overview.expiringSoon}</strong><small>Students needing renewal follow-up</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>Restricted</span><span className="badge badge-coral">Access</span></div><strong>{overview.restrictedStudents}</strong><small>Accounts requiring admin action</small></div>
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
        <div className="workspace-card">
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

        <aside className="workspace-card drawer-card">
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
  return (
    <div className="workspace-page animate-fade-up">
      <div className="split-layout">
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Teacher Queue</div><h2 className="workspace-card-title">Pending approvals and ratings</h2></div></div>
          <div className="workspace-card-body list-stack">
            {adminTeachers.map((teacher) => (
              <div key={teacher.name} className="queue-card">
                <div className="workspace-card-title-row">
                  <strong>{teacher.name}</strong>
                  <span className={`state-chip ${teacher.pending === 'Approved' ? 'state-chip--success' : 'state-chip--warning'}`}>{teacher.pending}</span>
                </div>
                <p>{teacher.subject} • Rating {teacher.rating} • {teacher.students} students</p>
                <div className="inline-actions">
                  <button className="btn btn-primary btn-sm" type="button">Assign Courses</button>
                  <button className="btn btn-ghost btn-sm" type="button">View Ratings</button>
                </div>
              </div>
            ))}
            {adminTeachers.length === 0 ? (
              <div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No teachers yet</h3><p>Real teacher accounts and approvals will appear here.</p></div>
            ) : null}
          </div>
        </div>

        <aside className="workspace-card drawer-card">
          <div className="workspace-card-head"><div><div className="label-xs">Teacher Detail</div><h3 className="workspace-card-title">No teacher selected</h3></div></div>
          <div className="workspace-card-body list-stack">
            <div className="metric-row"><span>Approval status</span><strong>No data</strong></div>
            <div className="metric-row"><span>Student rating</span><strong>No data</strong></div>
            <div className="metric-row"><span>Assignable courses</span><strong>0</strong></div>
            <button className="btn btn-amber" type="button">Approve Teacher</button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function AdminCoursesPage() {
  return (
    <div className="workspace-page animate-fade-up">
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
