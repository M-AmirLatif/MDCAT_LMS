import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MCQRenderer from '../components/MCQRenderer'
import API from '../services/api'
import './NumsPaperKey2026.css'

export default function NumsPaperKey2026() {
  const { chapterId = 'nums-mdcat-2026-paper' } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paper, setPaper] = useState(null)
  const [mcqs, setMcqs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [rangeFilter, setRangeFilter] = useState('all') // 'all', '1-50', '51-100', '101-150'
  const [expandedExplanations, setExpandedExplanations] = useState({})
  const [copiedKeys, setCopiedKeys] = useState(false)

  useEffect(() => {
    let alive = true
    const fetchPaperKey = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await API.get(`/mcqs/public/paper-key/${chapterId}`)
        if (!alive) return
        if (res.data?.success) {
          setPaper(res.data.paper)
          setMcqs(res.data.mcqs || [])
        } else {
          setError(res.data?.error || 'Failed to load paper details')
        }
      } catch (err) {
        if (!alive) return
        console.error('Error fetching paper key:', err)
        setError('Could not load NUMS MDCAT 2026 paper key. Please refresh the page.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    fetchPaperKey()
    return () => {
      alive = false
    }
  }, [chapterId])

  const toggleExplanation = (qId) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }))
  }

  const handleCopyKeys = () => {
    if (!mcqs.length) return
    const keyString = mcqs
      .map((m, idx) => `Q${m.originalQuestionNumber || idx + 1}: ${m.correctAnswer || '-'}`)
      .join('\n')
    navigator.clipboard?.writeText(keyString).then(() => {
      setCopiedKeys(true)
      setTimeout(() => setCopiedKeys(false), 2500)
    })
  }

  const scrollToQuestion = (qNum) => {
    const el = document.getElementById(`mcq-card-${qNum}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.style.boxShadow = '0 0 0 2px #0284c7'
      setTimeout(() => {
        el.style.boxShadow = ''
      }, 1500)
    }
  }

  const filteredMcqs = useMemo(() => {
    let list = mcqs

    // Range filter
    if (rangeFilter === '1-50') {
      list = list.filter((m, idx) => {
        const num = Number(m.originalQuestionNumber || idx + 1)
        return num >= 1 && num <= 50
      })
    } else if (rangeFilter === '51-100') {
      list = list.filter((m, idx) => {
        const num = Number(m.originalQuestionNumber || idx + 1)
        return num >= 51 && num <= 100
      })
    } else if (rangeFilter === '101-150') {
      list = list.filter((m, idx) => {
        const num = Number(m.originalQuestionNumber || idx + 1)
        return num >= 101 && num <= 150
      })
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const cleaned = q.replace(/^(?:q(?:uestion)?|\#)\s*/i, '').trim()
      const isNum = /^\d+$/.test(cleaned)
      const targetNum = isNum ? parseInt(cleaned, 10) : null

      list = list.filter((m, idx) => {
        const qNum = Number(m.originalQuestionNumber || idx + 1)
        if (isNum && qNum === targetNum) return true

        const text = String(m.questionText || m.question || '').toLowerCase()
        if (text.includes(q)) return true

        const opts = (m.options || []).some((opt) =>
          String(opt.text || '').toLowerCase().includes(q)
        )
        if (opts) return true

        return false
      })
    }

    return list
  }, [mcqs, rangeFilter, searchQuery])

  // Build Quiz JSON-LD Schema for rich snippet ranking
  const jsonLdSchema = useMemo(() => {
    const sampleQuestions = mcqs.slice(0, 30).map((m, idx) => {
      const qNum = m.originalQuestionNumber || idx + 1
      const correctOpt = (m.options || []).find((opt) => opt.isCorrect) || {}
      return {
        '@type': 'Question',
        name: `Question ${qNum}: ${(m.questionText || m.question || '').slice(0, 120)}`,
        text: m.questionText || m.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Option ${m.correctAnswer}: ${correctOpt.text || ''}`,
        },
      }
    })

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Quiz',
          name: 'NUMS MDCAT 2026 Official Answer Key & Solved Paper',
          description:
            'Complete 150 solved MCQs and official answer keys for NUMS MDCAT 2026 paper conducted by National University of Medical Sciences.',
          educationalLevel: 'Medical College Admission Test (MDCAT)',
          hasPart: sampleQuestions,
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Where can I find the official NUMS MDCAT 2026 Answer Key?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The complete NUMS MDCAT 2026 answer key for all 150 questions is published with step-by-step verified explanations on AceMDCAT at https://www.acemdcat.com/past-papers/nums-2026-answer-key.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I solve the NUMS MDCAT 2026 paper online for free?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! On AceMDCAT, students can solve the full 150-question NUMS MDCAT 2026 exam in real exam timed mode without logging in, with instant score calculation and analysis.',
              },
            },
            {
              '@type': 'Question',
              name: 'What was the total number of MCQs in NUMS MDCAT 2026?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'NUMS MDCAT 2026 contained 150 multiple choice questions divided across Biology, Chemistry, Physics, and English sections with no negative marking.',
              },
            },
          ],
        },
      ],
    }
  }, [mcqs])

  const shareText = encodeURIComponent(
    `*NUMS MDCAT 2026 Answer Key & Solved Paper is OUT!* ⚡\n\nCheck all 150 MCQs with official keys & step-by-step explanations, or solve online free in exam mode:\nhttps://www.acemdcat.com/past-papers/nums-2026-answer-key`
  )
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareText}`

  return (
    <div className="nums-key-page">
      <Helmet>
        <title>NUMS MDCAT 2026 Answer Key & Solved Paper (150 MCQs) | AceMDCAT</title>
        <meta
          name="description"
          content="Official NUMS MDCAT 2026 Answer Key & 150 Solved MCQs with step-by-step explanations. Solve online free without login on AceMDCAT."
        />
        <meta
          name="keywords"
          content="NUMS MDCAT 2026 answer key, NUMS 2026 solved paper, NUMS 2026 test key, NUMS MDCAT paper 2026, NUMS answer key pdf, MDCAT past papers, NUMS online test free"
        />
        <link rel="canonical" href="https://www.acemdcat.com/past-papers/nums-2026-answer-key" />

        {/* OpenGraph & Social Cards */}
        <meta property="og:title" content="NUMS MDCAT 2026 Answer Key & Complete Solved Paper (150 MCQs)" />
        <meta
          property="og:description"
          content="Check your score! Official answer key and step-by-step solutions for NUMS MDCAT 2026 paper. Solve online free on AceMDCAT."
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.acemdcat.com/past-papers/nums-2026-answer-key" />
        <meta property="og:image" content="https://www.acemdcat.com/logo512.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NUMS MDCAT 2026 Answer Key & Solved Paper (150 MCQs)" />
        <meta
          name="twitter:description"
          content="Official NUMS MDCAT 2026 Answer Key & 150 Solved MCQs. Solve online free on AceMDCAT."
        />

        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(jsonLdSchema)}</script>
      </Helmet>

      {/* Top Header Navbar */}
      <nav className="nums-nav" aria-label="Main">
        <div className="nums-nav-inner">
          <Link to="/" className="nums-nav-brand" title="AceMDCAT Home">
            <div className="nums-nav-logo-badge">A</div>
            <div>
              <div className="nums-nav-brand-title">AceMDCAT</div>
              <div className="nums-nav-brand-tag">Pakistan's #1 MDCAT Platform</div>
            </div>
          </Link>

          <div className="nums-nav-actions">
            <Link
              to={`/mcqs/past-papers/${chapterId}/attempt`}
              className="btn nums-cta-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
            >
              ⚡ Solve Online Test
            </Link>
            <Link
              to="/login"
              className="btn nums-cta-secondary"
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            >
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="nums-hero">
        <div className="nums-badge-row">
          <span className="nums-badge nums-badge--urgent">🔥 Just Conducted Today</span>
          <span className="nums-badge nums-badge--verified">✅ 100% Verified Answer Key</span>
          <span className="nums-badge nums-badge--free">🆓 Free • No Login Required</span>
        </div>

        <h1 className="nums-hero-title">NUMS MDCAT 2026 Answer Key & Solved Paper</h1>
        <p className="nums-hero-subtitle">
          Complete official 150 MCQs with verified correct keys and step-by-step explanations. Match
          your carbon copy sheet or solve the full test online in real timed exam mode.
        </p>

        <div className="nums-cta-cluster">
          <Link
            to={`/mcqs/past-papers/${chapterId}/attempt`}
            className="btn nums-cta-primary"
          >
            ⚡ Solve 150 MCQs Online (Timed Exam Mode)
          </Link>
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn nums-cta-whatsapp"
          >
            💬 Share with Friends on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('answer-key-section')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="btn nums-cta-secondary"
          >
            📋 Jump to Answer Key (Q1–Q150)
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="route-loading" style={{ margin: '0 auto 1rem' }}>
            Loading NUMS MDCAT 2026 Paper Key...
          </div>
          <p style={{ color: '#94a3b8' }}>Fetching all 150 MCQs & verified keys...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ color: '#f87171', fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 700 }}>
            {error}
          </div>
          <button
            type="button"
            className="nums-cta-primary"
            onClick={() => window.location.reload()}
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <main>
          {/* Quick Answer Key Matrix */}
          <section className="nums-quick-key-card" id="answer-key-section">
            <div className="nums-quick-key-head">
              <div className="nums-quick-key-title">
                <span>📋 Official Answer Key Matrix (150 MCQs)</span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                  Click any question # to inspect solution
                </span>
              </div>
              <button
                type="button"
                className="nums-cta-secondary"
                onClick={handleCopyKeys}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
              >
                {copiedKeys ? '✓ Copied All Keys!' : '📋 Copy All Keys'}
              </button>
            </div>

            <div className="nums-quick-key-grid">
              {mcqs.map((mcq, idx) => {
                const qNum = mcq.originalQuestionNumber || idx + 1
                return (
                  <button
                    key={mcq._id || idx}
                    type="button"
                    className="nums-quick-key-item"
                    onClick={() => scrollToQuestion(qNum)}
                    title={`Go to Question ${qNum}`}
                  >
                    <span className="nums-key-qnum">#{qNum}</span>
                    <span className="nums-key-ans">{mcq.correctAnswer || '-'}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Search and Filter Controls */}
          <section className="nums-controls-bar">
            <div className="nums-search-box">
              <span className="nums-search-icon">🔍</span>
              <input
                type="text"
                className="nums-search-input"
                placeholder="Search question wording or jump to # (e.g. 88)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="nums-range-buttons">
              <button
                type="button"
                className={`nums-range-btn ${rangeFilter === 'all' ? 'nums-range-btn--active' : ''}`}
                onClick={() => setRangeFilter('all')}
              >
                All (150)
              </button>
              <button
                type="button"
                className={`nums-range-btn ${rangeFilter === '1-50' ? 'nums-range-btn--active' : ''}`}
                onClick={() => setRangeFilter('1-50')}
              >
                Q1 – Q50
              </button>
              <button
                type="button"
                className={`nums-range-btn ${rangeFilter === '51-100' ? 'nums-range-btn--active' : ''}`}
                onClick={() => setRangeFilter('51-100')}
              >
                Q51 – Q100
              </button>
              <button
                type="button"
                className={`nums-range-btn ${rangeFilter === '101-150' ? 'nums-range-btn--active' : ''}`}
                onClick={() => setRangeFilter('101-150')}
              >
                Q101 – Q150
              </button>
            </div>
          </section>

          {/* Detailed Question List */}
          <section className="nums-mcq-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
              <span>Showing {filteredMcqs.length} of 150 questions</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
                >
                  Clear search
                </button>
              )}
            </div>

            {filteredMcqs.map((mcq, idx) => {
              const qNum = mcq.originalQuestionNumber || idx + 1
              const isExpanded = Boolean(expandedExplanations[mcq._id])
              const options = mcq.options || []

              return (
                <article
                  key={mcq._id || idx}
                  id={`mcq-card-${qNum}`}
                  className="nums-mcq-card"
                >
                  <div className="nums-mcq-header">
                    <span className="nums-mcq-qnum-tag">Question #{qNum}</span>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                      Official Key: Option {mcq.correctAnswer}
                    </span>
                  </div>

                  {/* Question Statement with KaTeX & Formula rendering */}
                  <div className="nums-mcq-statement">
                    <MCQRenderer
                      text={mcq.questionText || mcq.question}
                      images={mcq.questionImages || []}
                    />
                  </div>

                  {/* Options Grid */}
                  <div className="nums-options-grid">
                    {options.map((opt, optIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][optIdx] || String.fromCharCode(65 + optIdx)
                      const isCorrect = opt.isCorrect || mcq.correctAnswer === letter

                      return (
                        <div
                          key={letter}
                          className={`nums-option-pill ${isCorrect ? 'nums-option-pill--correct' : ''}`}
                        >
                          <span className="nums-option-letter">{letter}</span>
                          <span className="nums-option-text">
                            <MCQRenderer text={opt.text} images={opt.images || []} />
                          </span>
                          {isCorrect && (
                            <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Explanation Toggle */}
                  {(mcq.explanationText || mcq.explanation) && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExplanation(mcq._id)}
                        className="nums-cta-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                      >
                        {isExpanded ? 'Hide Explanation ▲' : 'Show Explanation ▼'}
                      </button>

                      {isExpanded && (
                        <div className="nums-explanation-box">
                          <div className="nums-explanation-title">💡 Step-by-Step Solution:</div>
                          <MCQRenderer
                            text={mcq.explanationText || mcq.explanation}
                            images={mcq.explanationImages || []}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </section>

          {/* Bottom Conversion Section */}
          <section className="nums-bottom-conversion">
            <h2 className="nums-conversion-title">Want to Test Yourself Under Real Exam Conditions?</h2>
            <p className="nums-conversion-text">
              Solve the full 150 MCQs with our live countdown timer, interactive question navigator,
              and instant detailed performance analytics. Free forever, no signup required!
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to={`/mcqs/past-papers/${chapterId}/attempt`}
                className="btn nums-cta-primary"
              >
                ⚡ Start Timed Online Test Now
              </Link>
              <Link
                to="/register"
                className="btn nums-cta-secondary"
              >
                Create Free AceMDCAT Account
              </Link>
            </div>
          </section>
        </main>
      )}

      {/* Floating Action Button for Mobile */}
      <div className="nums-floating-action">
        <Link
          to={`/mcqs/past-papers/${chapterId}/attempt`}
          className="nums-float-btn nums-float-btn--solve"
        >
          ⚡ Solve Online
        </Link>
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="nums-float-btn nums-float-btn--wa"
        >
          💬 WhatsApp
        </a>
      </div>
    </div>
  )
}
