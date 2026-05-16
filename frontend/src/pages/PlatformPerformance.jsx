import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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
  const { summary, subjects, performanceTrend, practiceAttempts, loading } = useStudentPerformanceData()
  const visibleSubjects = subjects.length ? subjects : mdcatSubjects

  return (
    <div className="workspace-page animate-fade-up">
      <div className="workspace-columns-4">
        <div className="stat-tile stat-tile--purple"><div className="stat-tile-top"><span>Attempted MCQs</span><StatIcon tone="purple" /></div><strong>{summary.totalAttempted}</strong><small>{Math.max(summary.totalMcqs - summary.totalAttempted, 0)} still unattempted</small></div>
        <div className="stat-tile stat-tile--teal"><div className="stat-tile-top"><span>Overall Accuracy</span><StatIcon tone="teal" /></div><strong>{summary.overallAccuracy}%</strong><small>Live average across all attempts</small></div>
        <div className="stat-tile stat-tile--amber"><div className="stat-tile-top"><span>Best Subject</span><StatIcon tone="amber" /></div><strong>{summary.bestSubject}</strong><small>Highest current subject accuracy</small></div>
        <div className="stat-tile stat-tile--coral"><div className="stat-tile-top"><span>Weakest Subject</span><StatIcon tone="coral" /></div><strong>{summary.weakestSubject}</strong><small>Main recovery target for this week</small></div>
      </div>

      <div className="workspace-section-grid">
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
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.gridColor} />
                  <XAxis dataKey="attemptDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTheme.axisColor }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTheme.axisColor }} domain={[40, 100]} />
                  <Tooltip contentStyle={{ background: chartTheme.tooltipBg, color: chartTheme.tooltipText, border: 'none', borderRadius: 12 }} labelStyle={{ color: chartTheme.tooltipText }} />
                  <Legend wrapperStyle={{ color: chartTheme.legendColor }} />
                  <Line type="monotone" dataKey="Biology" stroke="#1db884" strokeWidth={3} dot={false} connectNulls />
                  <Line type="monotone" dataKey="Chemistry" stroke="#6c47ff" strokeWidth={3} dot={false} connectNulls />
                  <Line type="monotone" dataKey="Physics" stroke="#4a90e2" strokeWidth={3} dot={false} connectNulls />
                  <Line type="monotone" dataKey="English" stroke="#f59e0b" strokeWidth={3} dot={false} connectNulls />
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

        <div className="insight-card">
          <div className="insight-card-top">
            <div>
              <div className="label-xs">AI Recommendation</div>
              <h3 className="workspace-card-title">Recommendations will appear after real attempts</h3>
            </div>
            <div className="insight-badge">Waiting for data</div>
          </div>
          <p className="insight-copy">
            The system needs real chapter attempts before it can calculate weak areas, recovery blocks, and suggested test sets.
          </p>
          <div className="insight-highlights">
            <div className="insight-highlight"><span>Best recovery block</span><strong>No data yet</strong></div>
            <div className="insight-highlight"><span>Suggested test set</span><strong>No data yet</strong></div>
            <div className="insight-highlight insight-highlight--accent"><span>Target uplift</span><strong>0%</strong></div>
          </div>
        </div>
      </div>

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
                  <strong>{subject.accuracy}%</strong>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ '--fill': `${subject.accuracy}%`, width: `${subject.accuracy}%`, background: subject.name === 'Biology' ? 'var(--grad-teal)' : subject.name === 'Chemistry' ? 'linear-gradient(135deg, #6C47FF 0%, #1DB884 100%)' : subject.name === 'Physics' ? 'linear-gradient(135deg, #4A90E2 0%, #73B1FF 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #FFB648 100%)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

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
      </div>
    </div>
  )
}
