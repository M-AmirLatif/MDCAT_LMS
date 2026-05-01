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
import './PlatformPages.css'
import {
  adminStudents,
  adminTeachers,
  adminTransactions,
  permissionMatrix,
  superAdminLogs,
  teacherAssignments,
  teacherStudents,
} from './platformContent'

const scoreDistribution = [
  { band: '40-50', count: 18 },
  { band: '50-60', count: 34 },
  { band: '60-70', count: 48 },
  { band: '70-80', count: 59 },
  { band: '80-90', count: 43 },
]

const multiStudentTrend = [
  { week: 'W1', ayesha: 82, usman: 64, iqra: 50 },
  { week: 'W2', ayesha: 84, usman: 66, iqra: 54 },
  { week: 'W3', ayesha: 86, usman: 69, iqra: 57 },
  { week: 'W4', ayesha: 89, usman: 71, iqra: 61 },
]

export function TeacherStudentsPage() {
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
                {teacherStudents.map((student) => (
                  <tr key={student.name}>
                    <td>{student.name}</td>
                    <td>{student.city}</td>
                    <td>{student.score}%</td>
                    <td>{student.streak}</td>
                    <td>{student.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="workspace-card drawer-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Student Detail</div>
              <h3 className="workspace-card-title">Ayesha Rehman</h3>
            </div>
          </div>
          <div className="workspace-card-body">
            <div className="chart-panel" style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={multiStudentTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(108,71,255,0.08)" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[40, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ayesha" stroke="#6c47ff" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="metric-row"><span>Email</span><strong>ayesha@example.com</strong></div>
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
      </div>

      <div className="split-layout">
        <section className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">MCQ Entry</div><h3 className="workspace-card-title">Question builder</h3></div></div>
          <div className="workspace-card-body">
            <p><strong>Question:</strong> Which organelle is primarily responsible for ATP production in eukaryotic cells?</p>
            <div className="workspace-card" style={{ marginTop: '16px' }}>
              <div className="workspace-card-body">
                <p>Option A: Golgi apparatus • Option B: Mitochondrion • Option C: Ribosome • Option D: Lysosome</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Explanation</div><h3 className="workspace-card-title">Save final MCQ</h3></div></div>
          <div className="workspace-card-body form-shell">
            <div className="floating-field"><label htmlFor="score">Correct Option</label><input id="score" type="text" defaultValue="B" /></div>
            <div className="floating-field"><label htmlFor="feedback">Explanation</label><textarea id="feedback" defaultValue="Mitochondria generate ATP through aerobic respiration, so they are called the powerhouse of the cell." rows="5" /></div>
            <button className="btn btn-primary" type="button">Save MCQ</button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function TeacherAnalyticsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="workspace-columns-4">
        <div className="stat-tile"><span>Class Average</span><strong>76%</strong></div>
        <div className="stat-tile"><span>Submission Rate</span><strong>84%</strong></div>
        <div className="stat-tile"><span>Live Attendance</span><strong>71%</strong></div>
        <div className="stat-tile"><span>At Risk</span><strong>23</strong></div>
      </div>

      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Distribution</div><h2 className="workspace-card-title">Score distribution</h2></div></div>
          <div className="workspace-card-body chart-panel">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(108,71,255,0.08)" />
                <XAxis dataKey="band" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1db884" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-head"><div><div className="label-xs">Heatmap</div><h3 className="workspace-card-title">Subject mastery</h3></div></div>
          <div className="workspace-card-body heatmap-grid">
            <div className="heat-cell" style={{ background: '#1db884' }}>Bio 89</div>
            <div className="heat-cell" style={{ background: '#4a90e2' }}>Phys 72</div>
            <div className="heat-cell" style={{ background: '#f59e0b' }}>Chem 68</div>
            <div className="heat-cell" style={{ background: '#6c47ff' }}>Eng 91</div>
          </div>
        </div>
      </div>

      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Comparison</div><h3 className="workspace-card-title">Multi-student line chart</h3></div></div>
        <div className="workspace-card-body chart-panel">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiStudentTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(108,71,255,0.08)" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} domain={[40, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ayesha" stroke="#6c47ff" strokeWidth={3} />
              <Line type="monotone" dataKey="usman" stroke="#1db884" strokeWidth={3} />
              <Line type="monotone" dataKey="iqra" stroke="#ff6b6b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function AdminStudentsPage() {
  return (
    <div className="workspace-page animate-fade-up">
      <div className="workspace-card">
        <div className="workspace-card-head"><div><div className="label-xs">Manage Students</div><h2 className="workspace-card-title">Enrollment and profile control</h2></div></div>
        <div className="workspace-card-body">
          <table className="simple-table">
            <thead>
              <tr><th><input type="checkbox" aria-label="Select all students" /></th><th>Name</th><th>Plan</th><th>City</th><th>Status</th><th>Tests</th><th>Action</th></tr>
            </thead>
            <tbody>
              {adminStudents.map((student) => (
                <tr key={student.name}>
                  <td><input type="checkbox" aria-label={`Select ${student.name}`} /></td>
                  <td>{student.name}</td>
                  <td>{student.plan}</td>
                  <td>{student.city}</td>
                  <td>{student.status}</td>
                  <td>{student.tests}</td>
                  <td><div className="inline-actions"><button className="btn btn-secondary btn-sm" type="button">Suspend</button><button className="btn btn-ghost btn-sm" type="button">Reset Password</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          </div>
        </div>

        <aside className="workspace-card drawer-card">
          <div className="workspace-card-head"><div><div className="label-xs">Teacher Detail</div><h3 className="workspace-card-title">Prof. Adeel Raza</h3></div></div>
          <div className="workspace-card-body list-stack">
            <div className="metric-row"><span>Approval status</span><strong>Pending</strong></div>
            <div className="metric-row"><span>Student rating</span><strong>4.8 / 5</strong></div>
            <div className="metric-row"><span>Assignable courses</span><strong>12</strong></div>
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
            <div className="floating-field"><label htmlFor="course-name">Subject</label><input id="course-name" type="text" defaultValue="Biology" /></div>
            <div className="floating-field"><label htmlFor="teacher">Assigned Teacher</label><select id="teacher" defaultValue="Dr. Hira Khan"><option>Dr. Hira Khan</option><option>Prof. Adeel Raza</option></select></div>
          </div>
          <div className="floating-field"><label htmlFor="description">Moderation Notes</label><textarea id="description" rows="6" defaultValue="Flag duplicated wording, verify correct answer mapping, and ensure the explanation matches MDCAT standard phrasing." /></div>
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
          <div className="floating-field"><label htmlFor="announcement-title">Title</label><input id="announcement-title" type="text" defaultValue="New Mock Test Window Opens Tonight" /></div>
          <div className="floating-field"><label htmlFor="announcement-body">Message</label><textarea id="announcement-body" rows="6" defaultValue="Push this update to students enrolled in premium plans and schedule it for 7:30 PM." /></div>
          <div className="floating-grid">
            <div className="floating-field"><label htmlFor="schedule">Schedule</label><input id="schedule" type="datetime-local" defaultValue="2026-05-01T19:30" /></div>
            <div className="floating-field"><label htmlFor="channel">Channel Mix</label><select id="channel" defaultValue="Push + Email + In-App"><option>Push + Email + In-App</option><option>Push only</option></select></div>
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
            <div className="floating-field"><label htmlFor="jazzcash">JazzCash Key</label><input id="jazzcash" type="password" defaultValue="sk_live_jazzcash_key" /></div>
            <div className="floating-field"><label htmlFor="easypaisa">EasyPaisa Key</label><input id="easypaisa" type="password" defaultValue="sk_live_easypaisa_key" /></div>
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
            <thead><tr><th>Permission</th><th>Student</th><th>Teacher</th><th>Admin</th><th>Super Admin</th></tr></thead>
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
        <div className="pricing-card"><div className="label-xs">Master Gateway Control</div><h3 className="workspace-card-title">JazzCash</h3><p>Primary payment route, callback health 97%.</p></div>
        <div className="pricing-card"><div className="label-xs">Payout Management</div><h3 className="workspace-card-title">Rs 1.2M pending</h3><p>Teacher and affiliate settlements.</p></div>
        <div className="pricing-card"><div className="label-xs">Refund Escalations</div><h3 className="workspace-card-title">7 open</h3><p>Admin-originated finance actions.</p></div>
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
          <div className="floating-field"><label htmlFor="sa-title">Title</label><input id="sa-title" type="text" defaultValue="Payment Gateway Maintenance Tonight" /></div>
          <div className="floating-field"><label htmlFor="sa-body">Message</label><textarea id="sa-body" rows="6" defaultValue="Push banner to all roles and force in-app acknowledgment for finance and admin users." /></div>
          <button className="btn btn-danger" type="button">Send Emergency Alert</button>
        </div>
      </section>
    </div>
  )
}
