import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { getAuthUser } from '../services/authStorage'
import './Home.css'

const stats = [
  ['4', 'MDCAT Subjects', 'people'],
  ['0', 'Published Chapters', 'chart'],
  ['0', 'Published MCQs', 'medical'],
  ['0', 'Student Attempts', 'trophy'],
]

function Icon({ name }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true }
  const paths = {
    people: <><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" /><path d="M15.5 15.5A5 5 0 0 1 21 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
    chart: <><path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="m7 15 3-4 3 2 4-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
    medical: <><path d="M9 3h6v5h5v6h-5v7H9v-7H4V8h5V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></>,
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="2" /><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
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
          <strong>0%</strong>
          <small>Weekly progress after launch</small>
        </div>
        <div className="lp-float-card lp-float-card-two">
          <span><i /> Next Class</span>
          <strong>Coming soon</strong>
          <small>Real live classes</small>
        </div>
        <div className="lp-float-card lp-float-card-three">
          <div className="lp-avatars"><b>A</b><b>S</b><b>H</b></div>
          <strong>Real learners after launch</strong>
        </div>

        <div className="lp-hero-content reveal">
          <div className="lp-batch-pill"><i /> MDCAT 2026 Batch Now Open</div>
          <h1>
            <span>MDCAT 2026:</span>
            <span className="lp-gradient-text">Faster, Smarter</span>
            <span>Preparation at Home</span>
          </h1>
          <p>Focused MDCAT preparation from the comfort of your home. Real chapters, MCQs, and analytics will be added by your teaching team.</p>
          <div className="lp-hero-ctas">
            <Link className="lp-btn lp-btn-primary" to="/register">Start Your Preparation Now</Link>
            <Link className="lp-btn lp-btn-ghost" to="/login">I Already Have an Account</Link>
            <Link className="lp-btn lp-btn-teal" to="/mcqs">Explore MDCAT Subjects</Link>
          </div>
          <div className="lp-student-line">Join MDCAT aspirants preparing smarter, together</div>
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
            <p>We will make your exam prep easier and enjoyable</p>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-dark">
        <div className="lp-container reveal">
          <h2 className="lp-section-title lp-section-title-dark">Built for Focused MDCAT Prep</h2>
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

      <section id="reviews" className="lp-section lp-section-dark">
        <div className="lp-container reveal">
          <h2 className="lp-section-title lp-section-title-dark">Student Reviews</h2>
          <div className="lp-review-meta">Reviews will appear after real student feedback is collected.</div>
        </div>
      </section>

      <section className="lp-final-cta">
        <div className="lp-grid-bg" />
        <h2>Ready to Start Your MDCAT Journey?</h2>
        <p>Build a daily practice habit with focused Biology, Chemistry, Physics, and English MCQs.</p>
        <div className="lp-hero-ctas">
          <Link className="lp-btn lp-btn-white" to="/register">Join Now</Link>
          <Link className="lp-btn lp-btn-ghost" to="/login">Login</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand"><span className="lp-mark">M</span><div><strong>MDCAT LMS</strong><small>Your MDCAT Prep Companion</small></div></div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </nav>
          <p>© 2026 MDCAT LMS</p>
        </div>
      </footer>
    </main>
  )
}
