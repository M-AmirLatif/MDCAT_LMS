import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { getAuthUser } from '../services/authStorage'
import './Home.css'

const stats = [
  ['400.6k+', 'Registered Students', 'people'],
  ['4.71', 'Rating', 'star'],
  ['30.2M+', 'Questions Attempted', 'chart'],
  ['6k+', 'Qualified Doctors', 'medical'],
  ['10k+', 'Engineers & IT Professionals', 'code'],
  ['500+', 'Cities Worldwide', 'globe'],
  ['9+ Years', 'Academic Excellence', 'trophy'],
  ['96%', 'Parent Satisfaction', 'heart'],
]

const subjects = [
  ['Biology', '10 MCQs + Explanations', 'bio', '/sample-test/biology'],
  ['Chemistry', '10 MCQs + Explanations', 'chem', '/sample-test/chemistry'],
  ['Physics', '10 MCQs + Explanations', 'phy', '/sample-test/physics'],
  ['English', '10 MCQs + Explanations', 'eng', '/sample-test/english'],
]

const reviews = [
  ['MDCAT PESHAWAR', 'Ayesha Khan', 'The chapter-wise practice and explanations made revision much easier at home.'],
  ['MDCAT LAHORE', 'Hamza Ali', 'Daily MCQs helped me identify weak areas in Biology and Physics before test day.'],
  ['MDCAT MULTAN', 'Sana Noor', 'The platform feels focused on MDCAT only. No confusing extra courses.'],
  ['MDCAT KARACHI', 'Bilal Ahmed', 'Sample tests, explanations, and progress tracking kept me consistent.'],
  ['MDCAT ISLAMABAD', 'Mehwish Raza', 'I could practice at night after college and still see clear performance analytics.'],
]

function Icon({ name }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true }
  const paths = {
    people: <><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" /><path d="M15.5 15.5A5 5 0 0 1 21 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    chart: <><path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="m7 15 3-4 3 2 4-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
    medical: <><path d="M9 3h6v5h5v6h-5v7H9v-7H4V8h5V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></>,
    code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="m14 5-4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
    globe: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" stroke="currentColor" strokeWidth="2" /></>,
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="2" /><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
    heart: <path d="M12 21s8-4.7 8-11a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 6.3 8 11 8 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  }
  return <svg {...common}>{paths[name]}</svg>
}

export default function Home() {
  const user = getAuthUser()

  return (
    <main className="landing">
      <header className="lp-nav">
        <Link className="lp-brand" to="/">
          <span className="lp-mark">M</span>
          <span>MDCAT LMS</span>
        </Link>
        <nav className="lp-links" aria-label="Public navigation">
          <a href="#home">Home</a>
          <a href="#courses">Courses</a>
          <a href="#sample">Sample Test</a>
          <a href="#reviews">About</a>
        </nav>
        <div className="lp-actions">
          <ThemeToggle className="theme-toggle--public" />
          {user ? (
            <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/dashboard">Go to Dashboard</Link>
          ) : (
            <>
              <Link className="lp-btn lp-btn-ghost lp-btn-sm" to="/login">Login</Link>
              <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/register">Join Now</Link>
            </>
          )}
        </div>
      </header>

      <section id="home" className="lp-hero">
        <div className="lp-orb lp-orb-one" />
        <div className="lp-orb lp-orb-two" />
        <div className="lp-grid-bg" />
        <div className="lp-float-card lp-float-card-one">
          <span>MDCAT BATCH 2026</span>
          <strong>84%</strong>
          <small>Weekly progress</small>
        </div>
        <div className="lp-float-card lp-float-card-two">
          <span><i /> Next Class</span>
          <strong>8:00 PM</strong>
          <small>Biology Rapid Revision</small>
        </div>
        <div className="lp-float-card lp-float-card-three">
          <div className="lp-avatars"><b>A</b><b>S</b><b>H</b></div>
          <strong>28k+ Active Learners</strong>
        </div>

        <div className="lp-hero-content reveal">
          <div className="lp-batch-pill"><i /> MDCAT 2026 Batch Now Open</div>
          <h1>
            <span>MDCAT 2026:</span>
            <span className="lp-gradient-text">Faster, Smarter</span>
            <span>Preparation at Home</span>
          </h1>
          <p>Best MDCAT prep from the comfort of your home. 400k+ students. 9+ years.</p>
          <div className="lp-hero-ctas">
            <Link className="lp-btn lp-btn-primary" to="/register">Start Your Preparation Now</Link>
            <Link className="lp-btn lp-btn-ghost" to="/login">I Already Have an Account</Link>
            <Link className="lp-btn lp-btn-teal" to="/sample-test">Try Free Sample Test</Link>
          </div>
          <div className="lp-student-line">★ 400.6k+ Online Registered Students</div>
        </div>
      </section>

      <section id="courses" className="lp-section lp-section-light">
        <div className="lp-container lp-value-grid reveal">
          <div>
            <p className="lp-label">Stress-free MDCAT prep</p>
            <h2>Join Our Stress-Free MDCAT Course for Guaranteed Admission in <span>Your Dream Medical College</span></h2>
            <p className="lp-copy">Specially designed for F.Sc pre-medical 2nd year, 1st year, and repeater students who want chapter-wise MCQ practice at home.</p>
            <div className="lp-row-actions">
              <Link className="lp-btn lp-btn-primary" to="/register">Yes I Want To Join</Link>
              <span className="lp-green-pill"><i /> New session starting soon | Limited slots</span>
            </div>
          </div>
          <div className="lp-video-card">
            <div className="lp-video-thumb">
              <button className="lp-play" aria-label="Play preview"><span /></button>
              <div className="lp-quote lp-quote-one">You will not need any academy</div>
              <div className="lp-quote lp-quote-two">Practice daily</div>
            </div>
            <p>We will make your exam prep easier & enjoyable</p>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-dark">
        <div className="lp-container reveal">
          <h2 className="lp-section-title lp-section-title-dark">Trusted by Thousands, Proven by Results</h2>
          <div className="lp-stat-grid">
            {stats.map(([value, label, icon], index) => (
              <article className={`lp-stat lp-stat-${index % 4}`} key={label}>
                <Icon name={icon} />
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sample" className="lp-section lp-section-light">
        <div className="lp-container lp-narrow reveal">
          <h2 className="lp-section-title">Try a Free Sample Test <em>No Login Required</em></h2>
          <p className="lp-center-copy">Practice 10 real-style MCQs, get explanations, and see your score instantly.</p>
          <div className="lp-subject-grid">
            {subjects.map(([name, meta, tone, path]) => (
              <Link className={`lp-subject lp-subject-${tone}`} to={path} key={name}>
                <div>
                  <strong>{name}</strong>
                  <span>{meta}</span>
                </div>
                <b>Start Test →</b>
              </Link>
            ))}
          </div>
          <Link className="lp-btn lp-btn-primary lp-btn-wide" to="/sample-test">Start Free Sample Test</Link>
          <p className="lp-micro-copy">No account needed • Instant results • Full explanations</p>
        </div>
      </section>

      <section id="reviews" className="lp-section lp-section-dark">
        <div className="lp-container reveal">
          <h2 className="lp-section-title lp-section-title-dark">8000+ Genuine Student Reviews</h2>
          <div className="lp-review-meta">EXCELLENT REVIEWS • <span>★★★★★</span> • 4.71 Average</div>
          <div className="lp-review-row">
            {reviews.map(([tag, name, text]) => (
              <article className="lp-review" key={name}>
                <span>{tag}</span>
                <div>★★★★★</div>
                <p>{text}</p>
                <footer><b>{name[0]}</b><strong>{name}</strong></footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-final-cta">
        <div className="lp-grid-bg" />
        <h2>Ready to Start Your MDCAT Journey?</h2>
        <p>Build a daily practice habit with focused Biology, Chemistry, Physics, and English MCQs.</p>
        <div className="lp-hero-ctas">
          <Link className="lp-btn lp-btn-white" to="/register">Join Now</Link>
          <Link className="lp-btn lp-btn-ghost" to="/sample-test">Try Free Test</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand"><span className="lp-mark">M</span><div><strong>MDCAT LMS</strong><small>Pakistan's #1 MDCAT Prep Platform</small></div></div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/sample-test">Sample Test</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </nav>
          <p>© 2026 MDCAT LMS</p>
        </div>
      </footer>
    </main>
  )
}
