import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { getAuthUser } from '../services/authStorage'
import API from '../services/api'
import './Home.css'

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

function formatStat(value) {
  if (value === null || value === undefined) return '—'
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

export default function Home() {
  const user = getAuthUser()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let alive = true
    API.get('/public/stats')
      .then((res) => {
        if (alive && res.data?.success) setStats(res.data)
      })
      .catch(() => {
        // Silently fail — stats section will show fallback
      })
    return () => { alive = false }
  }, [])

  const statItems = [
    [String(stats?.subjects ?? 4), 'MDCAT Subjects', 'people'],
    [formatStat(stats?.totalChapters ?? null), 'Published Chapters', 'chart'],
    [formatStat(stats?.totalMcqs ?? null), 'Published MCQs', 'medical'],
    [formatStat(stats?.totalAttempts ?? null), 'Student Attempts', 'trophy'],
  ]

  const hasContent = stats && (stats.totalChapters > 0 || stats.totalMcqs > 0)

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
          <strong>{hasContent ? `${stats.totalChapters} Chapters` : 'Building Content'}</strong>
          <small>{hasContent ? 'Chapters published and growing' : 'Content being added by teachers'}</small>
        </div>
        <div className="lp-float-card lp-float-card-two">
          <span><i /> MCQ Bank</span>
          <strong>{hasContent ? formatStat(stats.totalMcqs) : 'Coming soon'}</strong>
          <small>{hasContent ? 'Practice questions available' : 'MCQs being added daily'}</small>
        </div>
        <div className="lp-float-card lp-float-card-three">
          <div className="lp-avatars"><b>A</b><b>S</b><b>H</b></div>
          <strong>{stats?.totalStudents > 0 ? `${formatStat(stats.totalStudents)} learners registered` : 'Join the first batch'}</strong>
        </div>

        <div className="lp-hero-content reveal">
          <div className="lp-batch-pill"><i /> MDCAT 2026 Batch Now Open</div>
          <h1>
            <span>MDCAT 2026:</span>
            <span className="lp-gradient-text">Faster, Smarter</span>
            <span>Preparation at Home</span>
          </h1>
          <p>Focused MDCAT preparation from the comfort of your home. Real chapters, MCQs, and analytics — all in one platform.</p>
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
              <span className="lp-green-pill"><i /> {hasContent ? `${stats.totalChapters} chapters live | Enroll now` : 'New session starting soon | Limited slots'}</span>
            </div>
          </div>
          <div className="lp-features-grid">
            <div className="lp-feature-item">
              <div className="lp-feature-icon lp-feature-icon--purple">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6v5h5v6h-5v7H9v-7H4V8h5V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
              </div>
              <strong>Chapter-wise MCQs</strong>
              <p>Practice from a curated bank of MCQs organized by chapter and topic for focused preparation.</p>
            </div>
            <div className="lp-feature-item">
              <div className="lp-feature-icon lp-feature-icon--teal">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="m7 15 3-4 3 2 4-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <strong>Performance Analytics</strong>
              <p>Track your progress with detailed analytics — see your strengths and areas that need improvement.</p>
            </div>
            <div className="lp-feature-item">
              <div className="lp-feature-icon lp-feature-icon--amber">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 10l-4 4M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="2" /><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <strong>Daily Practice Habit</strong>
              <p>Build consistency with timed test sessions and track your daily streaks to stay on top of your prep.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-dark">
        <div className="lp-container reveal">
          <h2 className="lp-section-title lp-section-title-dark">Built for Focused MDCAT Prep</h2>
          <div className="lp-stat-grid">
            {statItems.map(([value, label, icon], index) => (
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
