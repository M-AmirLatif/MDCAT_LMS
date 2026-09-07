const fs = require("fs");
let code = fs.readFileSync("src/pages/TestReview.jsx", "utf8");

// 1. Add imports at the top
code = code.replace(
  "import { Link, useLocation, useNavigate } from 'react-router-dom'",
  "import { useState, useEffect } from 'react'\nimport { Link, useLocation, useNavigate } from 'react-router-dom'\nimport { toast } from 'react-hot-toast'\nimport API from '../services/api'"
);

// 2. Inject state + functions after "const { subject, chapter, result } = reviewState"
const hookAnchor = "const { subject, chapter, result } = reviewState";
const hookInjection = `const { subject, chapter, result } = reviewState
  const [savedStatus, setSavedStatus] = useState({})

  useEffect(() => {
    const ids = result.detailed.map(d => d.id)
    API.post('/flashcards/status', { mcqIds: ids })
      .then(res => setSavedStatus(res.data.savedStatus || {}))
      .catch(() => {})
  }, [result])

  const toggleFlashcard = (mcqId) => {
    API.post('/flashcards/toggle', { mcqId, subject: subject.name, chapterId: chapter.id })
      .then(res => {
        setSavedStatus(prev => ({ ...prev, [mcqId]: res.data.saved }))
        toast.success(res.data.saved ? 'Saved to Flashcards' : 'Removed from Flashcards')
      })
      .catch(() => toast.error('Could not save flashcard'))
  }`;
code = code.replace(hookAnchor, hookInjection);

// 3. Add the Save button into the review-question-top div, before </div>
const topClose = '              </div>\n              <div className="review-question-title">';
const topWithBtn = `              <button
                type="button"
                onClick={() => toggleFlashcard(item.id)}
                style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: savedStatus[item.id] ? '#f59e0b' : '#94a3b8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                {savedStatus[item.id] ? 'Saved' : 'Save'}
              </button>
              </div>
              <div className="review-question-title">`;
code = code.replace(topClose, topWithBtn);

fs.writeFileSync("src/pages/TestReview.jsx", code);
console.log("Done");
