import { useAuth } from '../context/AuthContext'
import useMcqSubjectSummary from '../hooks/useMcqSubjectSummary'
import useStudentPerformanceData from '../hooks/useStudentPerformanceData'
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


const SUBJECT_SERIES = [
  { key: 'Biology', color: '#1db884' },
  { key: 'Chemistry', color: '#7c5cff' },
  { key: 'Physics', color: '#4a90e2' },
  { key: 'English', color: '#f59e0b' },
]

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0))

function buildPath(points) {
  if (points.length < 2) {
    return points.map((point) => `M ${point.x} ${point.y}`).join(' ')
  }

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const midX = (previous.x + point.x) / 2
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

function PerformanceSvgChart({ data, mode = 'subjects', average = 0, legendValues = {} }) {
  const width = 760
  const height = 320
  const padding = { top: 26, right: 44, bottom: 56, left: 68 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const rows = data.length || 1
  const xFor = (index) => padding.left + (rows === 1 ? chartWidth / 2 : (index / (rows - 1)) * chartWidth)
  const yFor = (value) => padding.top + chartHeight - (clampPercent(value) / 100) * chartHeight
  const ticks = [0, 25, 50, 75, 100]
  const series = mode === 'overall' ? [{ key: 'Overall', color: '#7c5cff' }] : SUBJECT_SERIES
  const averageY = yFor(average)
  const labelStep = Math.max(1, Math.ceil(rows / 5))
  const shouldShowLabel = (index) => index === 0 || index === rows - 1 || (index % labelStep === 0 && rows - 1 - index > Math.ceil(labelStep / 2))

  return (
    <div className={`performance-svg-chart performance-svg-chart--${mode}`} role="img" aria-label={mode === 'overall' ? 'Combined accuracy chart' : 'Subject performance chart'}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {ticks.map((tick) => {
          const y = yFor(tick)
          return (
            <g key={tick}>
              <line className="performance-svg-grid" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text className="performance-svg-axis" x={padding.left - 12} y={y + 4} textAnchor="end">{tick}%</text>
            </g>
          )
        })}
        {average > 0 ? (
          <>
            <line className="performance-svg-average" x1={padding.left} x2={width - padding.right} y1={averageY} y2={averageY} />
            <text className="performance-svg-average-label" x={width - padding.right} y={Math.max(18, averageY - 8)} textAnchor="end">Avg {average}%</text>
          </>
        ) : null}
        {series.map((item) => {
          const points = data
            .map((row, index) => {
              const value = row[item.key]
              if (!Number.isFinite(Number(value))) return null
              return { x: xFor(index), y: yFor(value), value: clampPercent(value), label: row.attemptLabel || `A${index + 1}` }
            })
            .filter(Boolean)
          if (!points.length) return null
          const path = buildPath(points)
          const baseline = padding.top + chartHeight
          const areaPath = mode === 'overall' && points.length
            ? `${path} L ${points.at(-1).x} ${baseline} L ${points[0].x} ${baseline} Z`
            : null
          return (
            <g key={item.key}>
              {areaPath ? <path className="performance-svg-area" d={areaPath} /> : null}
              <path className="performance-svg-line-shadow" d={path} fill="none" stroke={item.color} />
              <path className="performance-svg-line" d={path} fill="none" stroke={item.color} />
              {points.map((point, index) => (
                <circle key={`${item.key}-${index}`} className="performance-svg-dot" cx={point.x} cy={point.y} r={index === points.length - 1 ? 4.5 : 3.2} fill={item.color} />
              ))}
            </g>
          )
        })}
        {data.map((row, index) => shouldShowLabel(index) ? (
          <text key={`${row.attemptLabel || index}-label`} className="performance-svg-axis performance-svg-x-axis" x={xFor(index)} y={height - 16} textAnchor="middle">
            {row.attemptLabel || `A${index + 1}`}
          </text>
        ) : null)}
      </svg>
      <div className="performance-svg-legend">
        {series.map((item) => {
          const label = mode === 'overall'
            ? `Combined accuracy: ${legendValues.Overall ?? average ?? 0}%`
            : `${item.key}: ${legendValues[item.key] ?? 0}%`
          return (
            <span key={item.key}>
              <i style={{ background: item.color }} />
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function PlatformPerformance() {
  const { user } = useAuth()
  const role = user?.role || 'student'
  const studentData = useStudentPerformanceData()
  const bankData = useMcqSubjectSummary()
  const isStudent = role === 'student'
  const { summary, subjects, performanceTrend, overallTrend, practiceAttempts, loading } = studentData
  const visibleSubjects = isStudent
    ? (subjects.length ? subjects : mdcatSubjects)
    : (bankData.subjects.length ? bankData.subjects : mdcatSubjects)
  const performanceSubjectNames = ['Biology', 'Chemistry', 'Physics', 'English']
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
          <div className="workspace-card-body chart-panel performance-trend-chart">
            {!loading && performanceTrend.length > 0 ? (
              <>
                <div className="performance-chart-plot">
                  <PerformanceSvgChart
                    data={performanceTrend}
                    average={pageSummary.overallAccuracy}
                    legendValues={Object.fromEntries(performanceSubjectNames.map((subjectName) => {
                      const latest = [...performanceTrend].reverse().find((point) => Number.isFinite(Number(point[subjectName])))
                      return [subjectName, latest ? Math.round(Number(latest[subjectName]) || 0) : 0]
                    }))}
                  />
                </div>
              </>
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
          <div className="workspace-card-body chart-panel performance-overall-chart">
            {!loading && overallTrend.length > 0 ? (
              <>
                <div className="performance-chart-plot">
                  <PerformanceSvgChart
                    data={overallTrend}
                    mode="overall"
                    average={pageSummary.overallAccuracy}
                    legendValues={{ Overall: Math.round(Number(overallTrend[overallTrend.length - 1]?.Overall) || 0) }}
                  />
                </div>
              </>
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
                  <strong>{attempt.subject} - {attempt.chapter}</strong>
                  <p>{attempt.correct}/{attempt.total} correct - Score {attempt.score}%</p>
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









