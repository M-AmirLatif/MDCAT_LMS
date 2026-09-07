const fs = require('fs');
let code = fs.readFileSync('src/pages/TestReview.jsx', 'utf8');

const target = `              <div className="review-question-top">\r\n                <span className="review-question-number">Question {index + 1}</span>\r\n                <span className={\`state-chip \${item.isCorrect ? 'state-chip--success' : 'state-chip--warning'}\`}>\r\n                  {item.isCorrect ? 'Correct' : 'Needs Review'}\r\n                </span>\r\n              </div>`;

const replacement = `              <div className="review-question-top" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="review-question-number">Question {index + 1}</span>
                <span className={\`state-chip \${item.isCorrect ? 'state-chip--success' : 'state-chip--warning'}\`}>
                  {item.isCorrect ? 'Correct' : 'Needs Review'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFlashcard(item.id)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: savedStatus[item.id] ? '#f59e0b' : '#94a3b8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {savedStatus[item.id] ? '\u2b50 Saved' : '\u2606 Save'}
                </button>
              </div>`;

const updated = code.replace(target, replacement);
if (updated === code) {
  // Try with LF endings
  const targetLF = target.replace(/\r\n/g, '\n');
  const updatedLF = code.replace(targetLF, replacement);
  if (updatedLF === code) {
    console.log("NO MATCH - dumping section:");
    const idx = code.indexOf('review-question-top');
    console.log(JSON.stringify(code.slice(idx - 10, idx + 300)));
  } else {
    fs.writeFileSync('src/pages/TestReview.jsx', updatedLF);
    console.log("REPLACED with LF endings");
  }
} else {
  fs.writeFileSync('src/pages/TestReview.jsx', updated);
  console.log("REPLACED with CRLF endings");
}
