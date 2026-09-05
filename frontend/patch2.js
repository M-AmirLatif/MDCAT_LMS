const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'PlatformRolePages.jsx');
let code = fs.readFileSync(file, 'utf8');

const target = export function TeacherAnalyticsPage() {
  const { user } = useAuth()
  const { summary, scoreDistribution, subjectMastery, multiStudentTrend } = useTeacherAnalyticsData();

const replacement = export function TeacherAnalyticsPage() {
  const { user } = useAuth()
  const { summary, scoreDistribution, subjectMastery, multiStudentTrend } = useTeacherAnalyticsData()
  
  const [topFailed, setTopFailed] = React.useState([])
  const [csvData, setCsvData] = React.useState([])
  
  React.useEffect(() => {
    fetch('/api/mcqs/teacher/analytics', {
      headers: { Authorization: \Bearer \\ }
    }).then(res => res.json()).then(data => {
      if (data.topFailed) setTopFailed(data.topFailed)
      if (data.csvData) setCsvData(data.csvData)
    }).catch(err => console.error(err))
  }, [])

  const downloadCsv = () => {
    if (!csvData.length) return alert('No data to export');
    const headers = 'Student Name,Email,Chapter,Score,Percentage,Date\\n';
    const rows = csvData.map(r => \"\","\","\","\","\%","\"\).join('\\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher_analytics.csv';
    a.click();
  };

code = code.replace(target, replacement);

const returnTarget =       <div className="card-grid">
        <div className="stat-tile"><span>Class Average</span><strong>{summary.classAverage}%</strong></div>;

const returnReplacement =       <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
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
        <div className="stat-tile"><span>Class Average</span><strong>{summary.classAverage}%</strong></div>;

code = code.replace(returnTarget, returnReplacement);
fs.writeFileSync(file, code);