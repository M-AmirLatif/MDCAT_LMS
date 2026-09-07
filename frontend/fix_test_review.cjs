const fs = require('fs');
let code = fs.readFileSync('src/pages/TestReview.jsx', 'utf8');

// Inject imports
code = code.replace(
  "import MCQRenderer from '../components/layout/MCQRenderer'",
  "import MCQRenderer from '../components/layout/MCQRenderer'\nimport API from '../services/api'\nimport { toast } from 'react-hot-toast'\nimport { useState, useEffect } from 'react'"
);

// Inject state and toggle function
const hookRegex = /const \{ subject, chapter, result \} = reviewState/;
code = code.replace(hookRegex, `const { subject, chapter, result } = reviewState
  const [savedStatus, setSavedStatus] = useState({})
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const mcqIds = result.detailed.map(d => d.id)
        const res = await API.post('/flashcards/status', { mcqIds })
        setSavedStatus(res.data.savedStatus || {})
      } catch (err) {}
    }
    fetchStatus()
  }, [result])

  const toggleFlashcard = async (mcqId) => {
    try {
      const res = await API.post('/flashcards/toggle', { mcqId, subject: subject.name, chapterId: chapter.id })
      setSavedStatus(prev => ({ ...prev, [mcqId]: res.data.saved }))
      if (res.data.saved) toast.success('Saved to Flashcards')
      else toast.success('Removed from Flashcards')
    } catch (err) {
      toast.error('Could not save flashcard')
    }
  }`);

// Replace ONLY the specific h3 inside the map function!
const targetHtml = `<h3 className="review-question-title"><MCQRenderer text={item.questionText || item.question} images={mcqQuestionImages(item)} /></h3>`;
const replacementHtml = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className="review-question-title" style={{ flex: 1 }}>
                  <MCQRenderer text={item.questionText || item.question} images={mcqQuestionImages(item)} />
                </h3>
                <button 
                  type="button" 
                  onClick={() => toggleFlashcard(item.id)} 
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: savedStatus[item.id] ? '#f59e0b' : '#94a3b8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', transition: 'all 0.2s', marginLeft: '12px', flexShrink: 0 }}
                >
                  {savedStatus[item.id] ? '? Saved' : '? Save to Flashcards'}
                </button>
              </div>`;

code = code.replace(targetHtml, replacementHtml);

fs.writeFileSync('src/pages/TestReview.jsx', code);
