import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { getAuthUser } from '../services/authStorage'
import heroImg from '../assets/hero.png'
import './Home.css'

export default function Home() {
  const user = getAuthUser()
  const navigate = useNavigate()
  const [whatsapp, setWhatsapp] = useState('')

  const trustStats = useMemo(
    () => [
      { value: '400.6k+', label: 'Registered Students' },
      { value: '4.71', label: 'Rating (4.2k+ reviews)' },
      { value: '30.2M+', label: 'Questions Attempted' },
      { value: '6k+', label: 'Qualified Doctors' },
      { value: '10k+', label: 'Engineers & IT Professionals' },
      { value: '500+', label: 'Cities Worldwide' },
      { value: '9+ Years', label: 'Academic Excellence' },
      { value: '96%', label: 'Parent Satisfaction' },
    ],
    [],
  )

  const scorecards = useMemo(
    () => [
      { name: 'Saad Shabbir', city: 'Multan', score: 197, badge: '3rd' },
      { name: 'Malaika Tul Eman', city: 'Sialkot', score: 196, badge: '3rd' },
      { name: 'Abdullah Tariq', city: 'Sahiwal', score: 196, badge: '4th' },
      { name: 'Raamiz Salman', city: 'Islamabad', score: 196, badge: '2nd' },
      { name: 'Ghadiya Waheed', city: 'Jhelum', score: 194, badge: '4th' },
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

  const handleJoin = (e) => {
    e.preventDefault()
    navigate('/register')
  }

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
                <img
                  src={heroImg}
                  alt="Top achievers"
                  className="lp-winners-img"
                  loading="eager"
                />
              </div>
            </div>

            <div className="lp-hero-card lp-hero-card--join">
              <h3>Join New Session Today</h3>
              <form className="lp-join-form" onSubmit={handleJoin}>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Enter Your Whatsapp No"
                  inputMode="tel"
                  aria-label="WhatsApp number"
                />
                <button className="btn btn-primary lp-join-btn" type="submit">
                  Start Your Preparation Now
                </button>
              </form>
              <div className="lp-join-meta">
                <div className="lp-join-count">
                  <strong className="lp-accent">400.6k+</strong>{' '}
                  <span>Online Registered Students</span>
                </div>
                <div className="lp-join-login">
                  Already have an account? <Link to="/login">Login</Link>
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
              <div className="lp-stat" key={s.label}>
                <div className="lp-stat-icon" aria-hidden="true" />
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
              <div className="lp-scorecard" key={card.name}>
                <div className="lp-scorecard-badge">{card.badge}</div>
                <div className="lp-scorecard-avatar" aria-hidden="true">
                  {card.name
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')}
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

