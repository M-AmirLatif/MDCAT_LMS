import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
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
import { mdcatSubjects } from './platformContent'

function StatIcon({ tone }) {
  return (
    <span className="stat-tile-icon" style={{ background: `rgba(${tone === 'purple' ? '108,71,255' : tone === 'teal' ? '29,184,132' : tone === 'amber' ? '245,158,11' : '255,107,107'},0.12)` }}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
        <path d="M5 18V8m5 10V5m5 13v-7m4 7V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export default function PlatformPerformance() {
  const chartTheme = useThemeMode()
  const { user } = useAuth()
  const role = user?.role || 'student'
  const studentData = useStudentPerformanceData()
  const bankData = useMcqSubjectSummary()
  const isStudent = role === 'student'
  const { summary, subjects, performanceTrend, overallTrend, practiceAttempts, loading } = studentData
  const visibleSubjects = isStudent
    ? (subjects.length ? subjects : mdcatSubjects)
    : (bankData.subjects.length ? bankData.subjects : mdcatSubjects)
  const totalMcqs = visibleSubjects.reduce((sum, subject) => sum + (Number(subject.totalMcqs) || 0), 0)
  const totalChapters = visibleSubjects.reduce((sum, subject) => sum + (Number(subject.totalChapters) || 0), 0)
  const strongestBank = [...visibleSubjects].sort((a, b) => (Number(b.totalMcqs) || 0) - (Number(a.totalMcqs) || 0))[0]?.name || 'No uploads yet'
  const weakestBank = [...visibleSubjects].sort((a, b) => (Number(a.totalMcqs) || 0) - (Number(b.totalMcqs) || 0))[0]?.name || 'No uploads yet'
  const pageSummary = isStudent
    ? summary
    : {
      totalAttempted: totalMcqs,
      totalMcqs: totalChapters,
      overallAccuracy: totalChapters,
      bestSubject: strongestBank,
      weakestSubject: weakestBank,
    }

  return (
    <div className="workspace-page animate-fade-up">
      <div className="card-grid">
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>{isStudent ? 'Attempted MCQs' : 'Uploaded MCQs'}</span><StatIcon tone="purple" /></div><strong>{pageSummary.totalAttempted}</strong><small>{isStudent ? `${Math.max(pageSummary.totalMcqs - pageSummary.totalAttempted, 0)} still unattempted` : 'Live subject-bank count'}</small></div>
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>{isStudent ? 'Overall Accuracy' : 'Total Chapters'}</span><StatIcon tone="teal" /></div><strong>{isStudent ? `${pageSummary.overallAccuracy}%` : pageSummary.overallAccuracy}</strong><small>{isStudent ? 'Live average across all attempts' : 'Across Biology, Chemistry, Physics, and English'}</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>{isStudent ? 'Best Subject' : 'Largest Bank'}</span><StatIcon tone="amber" /></div><strong>{pageSummary.bestSubject}</strong><small>{isStudent ? 'Highest current subject accuracy' : 'Most uploaded MCQs'}</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>{isStudent ? 'Weakest Subject' : 'Smallest Bank'}</span><StatIcon tone="coral" /></div><strong>{pageSummary.weakestSubject}</strong><small>{isStudent ? 'Main recovery target for this week' : 'Needs content coverage next'}</small></div>
      </div>

      {isStudent ? (
      <div className="workspace-section-grid performance-chart-grid">
        <div className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Subject Trend</div>
              <h2 className="workspace-card-title">Performance by subject over time</h2>
            </div>
          </div>
          <div className="workspace-card-body chart-panel">
            {!loading && performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend} margin={{ top: 22, right: 22, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.gridColor} />
                  <XAxis dataKey="attemptLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTheme.axisColor, fontWeight: 700 }} minTickGap={14} />
                  <YAxis width={44} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTheme.axisColor, fontWeight: 700 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`} />
                  {pageSummary.overallAccuracy > 0 ? (
                    <ReferenceLine y={pageSummary.overallAccuracy} stroke="#a590ff" strokeOpacity={0.6} strokeDasharray="6 6" label={{ value: `Overall ${pageSummary.overallAccuracy}%`, fill: chartTheme.axisColor, fontSize: 11, fontWeight: 800, position: 'insideTopRight' }} />
                  ) : null}
                  <Tooltip
                    formatter={(value, name) => [`${Math.round(Number(value) || 0)}%`, name]}
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload
                      return item ? `${item.attemptLabel} • ${item.attemptDate} • ${item.label}` : ''
                    }}
                    contentStyle={{ background: chartTheme.tooltipBg, color: chartTheme.tooltipText, border: 'none', borderRadius: 14, boxShadow: chartTheme.isDark ? '0 18px 42px rgba(0,0,0,0.42)' : '0 18px 42px rgba(42,51,86,0.16)' }}
                    labelStyle={{ color: chartTheme.tooltipText, fontWeight: 800 }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ color: chartTheme.legendColor, fontSize: 12, fontWeight: 700, paddingBottom: 10 }} />
                  <Line type="monotone" dataKey="Biology" stroke="#1db884" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 2 }} connectNulls />
                  <Line type="monotone" dataKey="Chemistry" stroke="#7c5cff" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 2 }} connectNulls />
                  <Line type="monotone" dataKey="Physics" stroke="#4a90e2" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 2 }} connectNulls />
                  <Line type="monotone" dataKey="English" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 2 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No performance trend yet</h3>
                <p>Graphs will appear after students submit real MCQ attempts.</p>
              </div>
            )}
          </div>
        </div>

        <div className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Overall Trend</div>
              <h2 className="workspace-card-title">Combined accuracy across all tests</h2>
            </div>
          </div>
          <div className="workspace-card-body chart-panel">
            {!loading && overallTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overallTrend} margin={{ top: 22, right: 22, left: 4, bottom: 8 }}>
                  <defs>
                    <linearGradient id="overallAccuracyArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.34} />
                      <stop offset="55%" stopColor="#4a90e2" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#1db884" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.gridColor} />
                  <XAxis dataKey="attemptLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTheme.axisColor, fontWeight: 700 }} minTickGap={14} />
                  <YAxis width={44} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTheme.axisColor, fontWeight: 700 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`} />
                  {pageSummary.overallAccuracy > 0 ? (
                    <ReferenceLine y={pageSummary.overallAccuracy} stroke="#a590ff" strokeOpacity={0.6} strokeDasharray="6 6" label={{ value: `Overall ${pageSummary.overallAccuracy}%`, fill: chartTheme.axisColor, fontSize: 11, fontWeight: 800, position: 'insideTopRight' }} />
                  ) : null}
                  <Tooltip
                    formatter={(value, name) => [`${Math.round(Number(value) || 0)}%`, name === 'Overall' ? 'Combined accuracy' : name]}
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload
                      return item ? `${item.attemptLabel} • ${item.attemptDate} • ${item.label}` : ''
                    }}
                    contentStyle={{ background: chartTheme.tooltipBg, color: chartTheme.tooltipText, border: 'none', borderRadius: 14, boxShadow: chartTheme.isDark ? '0 18px 42px rgba(0,0,0,0.42)' : '0 18px 42px rgba(42,51,86,0.16)' }}
                    labelStyle={{ color: chartTheme.tooltipText, fontWeight: 800 }}
                  />
                  <Area type="monotone" dataKey="Overall" name="Combined accuracy" stroke="#7c5cff" fill="url(#overallAccuracyArea)" strokeWidth={4} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No combined trend yet</h3>
                <p>The overall graph will appear after students submit real MCQ attempts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : null}

      <div className="workspace-section-grid">
        <div className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Subject Accuracy</div>
              <h2 className="workspace-card-title">Current standing by subject</h2>
            </div>
          </div>
          <div className="workspace-card-body list-stack">
            {visibleSubjects.map((subject) => (
              <div key={subject.id} className="progress-inline">
                <div className="progress-inline-row">
                  <span>{subject.name}</span>
                  <strong>{isStudent ? `${subject.accuracy}%` : `${subject.totalMcqs || 0} MCQs`}</strong>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ '--fill': `${isStudent ? subject.accuracy : totalMcqs ? Math.round(((subject.totalMcqs || 0) / totalMcqs) * 100) : 0}%`, width: `${isStudent ? subject.accuracy : totalMcqs ? Math.round(((subject.totalMcqs || 0) / totalMcqs) * 100) : 0}%`, background: subject.name === 'Biology' ? 'var(--grad-teal)' : subject.name === 'Chemistry' ? 'linear-gradient(135deg, #6C47FF 0%, #1DB884 100%)' : subject.name === 'Physics' ? 'linear-gradient(135deg, #4A90E2 0%, #73B1FF 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #FFB648 100%)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {isStudent ? (
        <div className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Recent Attempts</div>
              <h2 className="workspace-card-title">Latest chapter practice</h2>
            </div>
          </div>
          <div className="workspace-card-body list-stack">
            {practiceAttempts.map((attempt) => (
              <div key={attempt.id} className="timeline-item">
                <div className="timeline-dot" style={{ background: attempt.score >= 80 ? 'var(--teal)' : attempt.score >= 65 ? 'var(--amber)' : 'var(--coral)' }} />
                <div>
                  <strong>{attempt.subject} • {attempt.chapter}</strong>
                  <p>{attempt.correct}/{attempt.total} correct • Score {attempt.score}%</p>
                  <small>{attempt.date}</small>
                </div>
              </div>
            ))}
            {practiceAttempts.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No attempts yet</h3>
                <p>Recent practice history will appear after students submit real MCQs.</p>
              </div>
            ) : null}
          </div>
        </div>
        ) : (
        <div className="workspace-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Teacher Coverage</div>
              <h2 className="workspace-card-title">Subject-wise bank status</h2>
            </div>
          </div>
          <div className="workspace-card-body list-stack">
            {visibleSubjects.map((subject) => (
              <div key={`${subject.id}-coverage`} className="timeline-item">
                <div className="timeline-dot" style={{ background: subject.name === 'Biology' ? 'var(--teal)' : subject.name === 'Chemistry' ? 'var(--purple)' : subject.name === 'Physics' ? 'var(--indigo)' : 'var(--amber)' }} />
                <div>
                  <strong>{subject.name}</strong>
                  <p>{subject.totalChapters || 0} chapters - {subject.totalMcqs || 0} MCQs uploaded</p>
                  <small>{subject.totalMcqs > 0 ? 'Live bank data' : 'No uploads yet'}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
