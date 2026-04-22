import { Link, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { getAuthUser } from '../services/authStorage'
import { getSampleMcqs } from '../data/sampleMcqs'
import './Home.css'

export default function Home() {
  const user = getAuthUser()
  const navigate = useNavigate()

  const trustStats = useMemo(
    () => [
      {
        key: 'students',
        value: '400.6k+',
        label: 'Registered Students',
        tone: 'blue',
      },
      {
        key: 'rating',
        value: '4.71',
        label: 'Rating (4.2k+ reviews)',
        tone: 'orange',
      },
      {
        key: 'questions',
        value: '30.2M+',
        label: 'Questions Attempted',
        tone: 'violet',
      },
      {
        key: 'doctors',
        value: '6k+',
        label: 'Qualified Doctors',
        tone: 'green',
      },
      {
        key: 'engineers',
        value: '10k+',
        label: 'Engineers & IT Professionals',
        tone: 'blue',
      },
      {
        key: 'cities',
        value: '500+',
        label: 'Cities Worldwide',
        tone: 'orange',
      },
      {
        key: 'years',
        value: '9+ Years',
        label: 'Academic Excellence',
        tone: 'violet',
      },
      {
        key: 'satisfaction',
        value: '96%',
        label: 'Parent Satisfaction',
        tone: 'green',
      },
    ],
    [],
  )

  const scorecards = useMemo(
    () => [
      {
        name: 'Saad Shabbir',
        city: 'Multan',
        score: 197,
        badge: '3rd',
        uni: 'KEMU',
        year: 'MDCAT 2024',
        tone: 'blue',
      },
      {
        name: 'Malaika Tul Eman',
        city: 'Sialkot',
        score: 196,
        badge: '3rd',
        uni: 'KEMU',
        year: 'MDCAT 2024',
        tone: 'green',
      },
      {
        name: 'Abdullah Tariq',
        city: 'Sahiwal',
        score: 196,
        badge: '4th',
        uni: 'KEMU',
        year: 'MDCAT 2024',
        tone: 'violet',
      },
      {
        name: 'Raamiz Salman',
        city: 'Islamabad',
        score: 196,
        badge: '2nd',
        uni: 'AKU',
        year: 'MDCAT 2022',
        tone: 'orange',
      },
      {
        name: 'Ghadiya Waheed',
        city: 'Jhelum',
        score: 194,
        badge: '4th',
        uni: 'KEMU',
        year: 'MDCAT 2024',
        tone: 'blue',
      },
    ],
    [],
  )

  const reviews = useMemo(
    () => [
      {
        title: 'MDCAT Shumaila Rustom ali solangi',
        body:
          'I am very happy to hear top grade preparation for MDCAT tests thanks to top grade lectures. Thank you very much.',
        stars: 5,
      },
      {
        title: 'MDCAT DINA PESHAWAR',
        body:
          'It is a great app because I very understand the lectures and their way of teaching is helpful.',
        stars: 5,
      },
      {
        title: 'MDCAT Amna Noor Faisalabad',
        body:
          'When I joined TopGrade to start MDCAT preparation, I was very comfortable because I had brought my demo in 3–4 places first.',
        stars: 5,
      },
      {
        title: 'Love Kumar',
        body:
          'This is a nice app to learn if anyone wants to get selected in MDCAT or any other entrance exam.',
        stars: 5,
      },
      {
        title: 'MDCAT Mubeen Zulfiqar Mandi Bahauddin',
        body:
          'Each and everything is absolutely fantastic. Their lectures, bank and tests are best. Thanks.',
        stars: 5,
      },
    ],
      [],
    )

  const samplePreview = useMemo(() => {
    const picked = getSampleMcqs({ subject: 'all', limit: 3 })
    return picked.map((q) => ({
      id: q._id,
      topic: q.topic,
      question: q.question,
      options: q.options?.slice(0, 3) || [],
    }))
  }, [])

  const sampleSubjects = useMemo(
    () => [
      { key: 'biology', label: 'Biology', tone: 'green' },
      { key: 'chemistry', label: 'Chemistry', tone: 'orange' },
      { key: 'physics', label: 'Physics', tone: 'blue' },
      { key: 'english', label: 'English', tone: 'violet' },
    ],
    [],
  )

  const StatIcon = ({ name }) => {
    const common = {
      width: 22,
      height: 22,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      'aria-hidden': true,
      focusable: 'false',
    }

    switch (name) {
      case 'students':
        return (
          <svg {...common}>
            <path
              d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M4 21a8 8 0 0 1 16 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )
      case 'rating':
        return (
          <svg {...common}>
            <path
              d="M12 3.6 14.5 9l5.9.6-4.4 3.8 1.3 5.8L12 16.9 6.7 19.2 8 13.4 3.6 9.6 9.5 9 12 3.6Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )
      case 'questions':
        return (
          <svg {...common}>
            <path
              d="M4.5 5.5h15v10h-5l-3 3-3-3h-4v-10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M9 9a3 3 0 0 1 6 0c0 2-2 2-2 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 14.5h.01"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )
      case 'doctors':
        return (
          <svg {...common}>
            <path d="M10 3h4v3a2 2 0 0 1-4 0V3Z" stroke="currentColor" strokeWidth="2" />
            <path d="M7 7h10v5a5 5 0 0 1-10 0V7Z" stroke="currentColor" strokeWidth="2" />
            <path d="M12 11v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'engineers':
        return (
          <svg {...common}>
            <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 20v-8l5-5 5 5v8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M10 20v-4h4v4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )
      case 'cities':
        return (
          <svg {...common}>
            <path d="M4 20V9l6-3v14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M10 20V4l10 5v11" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 10h2M14 14h2M6 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'years':
        return (
          <svg {...common}>
            <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 8h16v13H4V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M7 12h4M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'satisfaction':
        return (
          <svg {...common}>
            <path
              d="M12 21s8-4.5 8-11a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 6.5 8 11 8 11Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )
      default:
        return null
    }
  }

  const MdcatBatchLogo = () => (
    <svg
      className="lp-batch-logo"
      viewBox="0 0 940 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MDCAT Batch 2026"
    >
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD06A" />
          <stop offset="55%" stopColor="#F2B544" />
          <stop offset="100%" stopColor="#D8901A" />
        </linearGradient>
        <linearGradient id="navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b4fd1" />
          <stop offset="55%" stopColor="#063aa4" />
          <stop offset="100%" stopColor="#041f63" />
        </linearGradient>
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#020617" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#logoShadow)">
        <rect x="30" y="36" width="880" height="288" rx="44" fill="url(#navy)" />
        <rect x="30" y="36" width="880" height="288" rx="44" fill="rgba(255,255,255,0.05)" />
        <rect x="30" y="36" width="880" height="288" rx="44" stroke="rgba(255,255,255,0.18)" />
      </g>

      {/* plus badge */}
      <g transform="translate(78 76)">
        <circle r="44" cx="0" cy="0" fill="#ff5a5f" />
        <circle r="44" cx="0" cy="0" fill="rgba(255,255,255,0.08)" />
        <path
          d="M-14 0h28M0-14v28"
          stroke="#ffffff"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </g>

      {/* MDCAT */}
      <text
        x="110"
        y="188"
        fontFamily="Plus Jakarta Sans, Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="160"
        letterSpacing="2"
        fill="url(#gold)"
      >
        MDCAT
      </text>

      {/* BATCH 2026 */}
      <text
        x="110"
        y="290"
        fontFamily="Plus Jakarta Sans, Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="108"
        letterSpacing="3"
        fill="#ffffff"
      >
        BATCH 2026
      </text>
    </svg>
  )

  return (
    <div className="landing">
      <header className="lp-top">
        <div className="lp-top-inner">
          <Link className="lp-brand" to="/">
            <span className="lp-mark" aria-hidden="true">
              M
            </span>
            <span className="lp-brand-text">
              <strong>MDCAT</strong> LMS
            </span>
          </Link>

          <div className="lp-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-head">
            <h1>MDCAT 2026: Faster, Easier & Better Preparation at Home</h1>
            <p>Best preparation from the comfort of your home</p>
          </div>

          <div className="lp-hero-logo" aria-hidden="false">
            <MdcatBatchLogo />
          </div>

          <div className="lp-hero-grid">
            <div className="lp-hero-card lp-hero-card--join">
              <h3>Join New Session Today</h3>
                <div className="lp-join-actions">
                  <button
                    className="btn btn-primary lp-join-btn"
                    type="button"
                    onClick={() => navigate('/register')}
                  >
                    Start Your Preparation Now
                  </button>
                  <Link className="btn btn-secondary lp-join-btn-secondary" to="/login">
                    I already have an account
                  </Link>
                  <Link className="btn btn-secondary lp-join-btn-secondary lp-join-btn-sample" to="/sample-test">
                    Try Free Sample Test
                  </Link>
                </div>
              <div className="lp-join-meta">
                <div className="lp-join-count">
                  <strong className="lp-accent">400.6k+</strong>{' '}
                  <span>Online Registered Students</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--cta">
        <div className="lp-container lp-cta-grid">
          <div className="lp-cta-copy">
            <h2>
              Join Our Stress-Free <span className="lp-accent">MDCAT</span> Course for Guaranteed Admission in{' '}
              <span className="lp-accent">Your Dream Medical College</span>
            </h2>
            <p>
              Specially designed for F.Sc pre-medical 2nd year, 1st year & repeater students.
            </p>
            <div className="lp-cta-actions">
              <Link to="/register" className="btn btn-primary">
                Yes I Want To Join
              </Link>
              <span className="lp-cta-note">New session starting soon | Limited slots</span>
            </div>
          </div>

          <div className="lp-cta-media">
            <div className="lp-video-card" role="img" aria-label="Video preview card">
              <button className="lp-play" type="button" onClick={() => navigate('/register')}>
                <span className="lp-play-icon" aria-hidden="true" />
              </button>
              <div className="lp-bubble lp-bubble--top">You will not be needing to join any academy</div>
              <div className="lp-bubble lp-bubble--bottom">We will make your exam prep easier & enjoyable</div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Trusted by Thousands, Proven by Results</h2>
          </div>

          <div className="lp-stats-grid">
            {trustStats.map((s) => (
              <div className={`lp-stat lp-tone-${s.tone}`} key={s.label}>
                <div className="lp-stat-icon" aria-hidden="true">
                  <StatIcon name={s.key} />
                </div>
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="lp-section lp-section--sample">
          <div className="lp-container">
            <div className="lp-section-head">
              <h2>Try a Free Sample Test (No Login)</h2>
              <p>Practice 10 real-style MCQs — get explanations and your score instantly.</p>
            </div>

            <div className="lp-sample-grid">
              <div className="lp-sample-left">
                <div className="lp-sample-subjects" role="list" aria-label="Sample test subjects">
                  {sampleSubjects.map((s) => (
                    <Link
                      key={s.key}
                      className={`lp-sample-subject lp-tone-${s.tone}`}
                      to={`/sample-test/${s.key}`}
                      role="listitem"
                    >
                      <div className="lp-sample-subject-title">{s.label}</div>
                      <div className="lp-sample-subject-meta">10 MCQs • Explanations</div>
                    </Link>
                  ))}
                </div>

                <div className="lp-center lp-sample-cta">
                  <Link className="btn btn-primary" to="/sample-test">
                    Start Free Sample Test
                  </Link>
                  <span className="lp-sample-note">
                    No account needed — join later to unlock full tests and courses.
                  </span>
                </div>
              </div>

              <div className="lp-sample-right" aria-label="Sample MCQ previews">
                {samplePreview.map((q) => (
                  <article className="lp-sample-q" key={q.id}>
                    <div className="lp-sample-q-topic">{q.topic}</div>
                    <div className="lp-sample-q-title">{q.question}</div>
                    <div className="lp-sample-q-options">
                      {q.options.map((o) => (
                        <div className="lp-sample-q-opt" key={o.text}>
                          {o.text}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
  
        {false && (
        <section className="lp-section lp-section--score">
          <div className="lp-container">
            <div className="lp-section-head">
            <h2>Published Scorecards</h2>
            <p>We committed — we delivered</p>
          </div>

          <div className="lp-score-title">
            <div className="lp-score-line">MDCAT Result 2024-25</div>
            <div className="lp-score-sub">Well done, TopGraders!</div>
          </div>

          <div className="lp-score-grid">
            {scorecards.map((card) => (
              <div className={`lp-scorecard lp-tone-${card.tone}`} key={card.name}>
                <div className="lp-scorecard-badge">{card.badge}</div>
                <div className="lp-scorecard-avatarWrap" aria-hidden="true">
                  <div className="lp-scorecard-avatarTile">
                    {card.name
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join('')}
                  </div>
                </div>
                <div className="lp-scorecard-tags">
                  <span className="lp-tag lp-tag--uni">{card.uni}</span>
                  <span className="lp-tag">{card.year}</span>
                </div>
                <div className="lp-scorecard-score">
                  <strong>{card.score}</strong>
                  <span>/200</span>
                </div>
                <div className="lp-scorecard-name">{card.name}</div>
                <div className="lp-scorecard-city">{card.city}</div>
              </div>
            ))}
          </div>

          <div className="lp-center">
            <button className="btn btn-secondary" type="button">
              View More
            </button>
          </div>
        </div>
      </section>
      )}

      <section className="lp-section lp-section--reviews">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>8000+ Genuine Student Reviews Across Various Platforms</h2>
            <p className="lp-reviews-meta">
              <span className="lp-chip">
                <span className="lp-chip-dot" aria-hidden="true" /> EXCELLENT REVIEWS
              </span>
              <span>
                <strong>4.71</strong> Average
              </span>
            </p>
          </div>

          <div className="lp-reviews-row" role="list" aria-label="Student reviews">
            {reviews.map((r) => (
              <article className="lp-review" key={r.title} role="listitem">
                <div className="lp-review-head">
                  <div className="lp-review-title">{r.title}</div>
                  <div className="lp-stars" aria-label={`${r.stars} star rating`}>
                    {'★★★★★'.slice(0, r.stars)}
                  </div>
                </div>
                <p className="lp-review-body">{r.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-mark" aria-hidden="true">
              M
            </span>
            <span>
              <strong>MDCAT</strong> LMS
            </span>
          </div>
          <div className="lp-footer-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/courses">Courses</Link>
          </div>
          <div className="lp-footer-copy">© {new Date().getFullYear()} MDCAT LMS</div>
        </div>
      </footer>
    </div>
  )
}

