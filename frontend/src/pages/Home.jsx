import { Link, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { getAuthUser } from '../services/authStorage'
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

  const WinnersVisual = () => (
    <svg
      className="lp-winners-svg"
      viewBox="0 0 820 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Top MDCAT achievers collage"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="wbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b4fd1" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#063aa4" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ff7a00" stopOpacity="0.10" />
        </linearGradient>
        <radialGradient id="wglow1" cx="20%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wglow2" cx="85%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wcard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="wring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f6ee5" />
          <stop offset="100%" stopColor="#ff7a00" />
        </linearGradient>
        <filter id="wsoftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="14"
            stdDeviation="14"
            floodColor="#020617"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      <rect x="0" y="0" width="820" height="320" rx="22" fill="url(#wbg)" />
      <rect x="0" y="0" width="820" height="320" rx="22" fill="url(#wglow1)" />
      <rect x="0" y="0" width="820" height="320" rx="22" fill="url(#wglow2)" />

      <g opacity="0.18">
        <text
          x="64"
          y="154"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="900"
          fontSize="120"
          fill="#ffffff"
        >
          2024
        </text>
        <text
          x="416"
          y="154"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="900"
          fontSize="120"
          fill="#ffffff"
        >
          2023
        </text>
      </g>

      {[
        { x: 92, label: 'AS', name: 'Ahsan', tone: '#2f6ee5' },
        { x: 324, label: 'MW', name: 'Malaika', tone: '#10b981' },
        { x: 556, label: 'AT', name: 'Abdullah', tone: '#ff7a00' },
      ].map((p) => (
        <g key={p.x} filter="url(#wsoftShadow)">
          <rect
            x={p.x}
            y="98"
            width="172"
            height="188"
            rx="22"
            fill="url(#wcard)"
            stroke="rgba(255,255,255,0.14)"
          />
          <circle
            cx={p.x + 86}
            cy="150"
            r="44"
            fill="rgba(255,255,255,0.10)"
            stroke="url(#wring)"
            strokeWidth="4"
          />
          <circle
            cx={p.x + 86}
            cy="150"
            r="38"
            fill="rgba(2,6,23,0.28)"
            stroke="rgba(255,255,255,0.18)"
          />
          <text
            x={p.x + 86}
            y="160"
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, Inter, system-ui, sans-serif"
            fontWeight="900"
            fontSize="22"
            fill="#ffffff"
          >
            {p.label}
          </text>
          <rect
            x={p.x + 34}
            y="208"
            width="104"
            height="28"
            rx="14"
            fill="rgba(255,255,255,0.10)"
            stroke="rgba(255,255,255,0.14)"
          />
          <circle cx={p.x + 48} cy="222" r="5" fill={p.tone} />
          <text
            x={p.x + 62}
            y="227"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="800"
            fontSize="12"
            fill="rgba(255,255,255,0.88)"
          >
            Top Achiever
          </text>
          <text
            x={p.x + 86}
            y="266"
            textAnchor="middle"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="800"
            fontSize="12"
            fill="rgba(255,255,255,0.72)"
          >
            {p.name}
          </text>
        </g>
      ))}
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

          <div className="lp-hero-grid">
            <div className="lp-hero-card lp-hero-card--winners">
              <div className="lp-hero-card-title">
                <span aria-hidden="true">🏆</span> The Winning Strategy
              </div>
              <div className="lp-hero-card-sub">Behind Our Positions in MDCAT</div>
              <div className="lp-winners-media">
                <WinnersVisual />
              </div>
            </div>

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
                <div className="lp-scorecard-photo" aria-hidden="true">
                  <div className="lp-scorecard-initials">
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

