import { Link } from 'react-router-dom'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import './Home.css'

export default function Home() {
  const user = getAuthUser()
  const sampleCourses = [
    {
      title: 'MDCAT Biology Foundations',
      category: 'Biology',
      description:
        'Concept-first lessons with diagrams, flashcards, and daily recall tests.',
      instructor: 'Dr. Ayesha Khan',
      lessons: 32,
    },
    {
      title: 'MDCAT Chemistry Numericals',
      category: 'Chemistry',
      description:
        'Practice-heavy modules with guided problem solving and quick formulas.',
      instructor: 'Sana Malik',
      lessons: 28,
    },
    {
      title: 'MDCAT Physics Sprint',
      category: 'Physics',
      description:
        'High-yield revision plan focused on motion, waves, and quick tricks.',
      instructor: 'Amir Latif',
      lessons: 24,
    },
  ]

  return (
    <div className="home">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <div className="nav-links">
          <Link to="/login" className="btn btn-login">
            Login
          </Link>
          <Link to="/register" className="btn btn-register">
            Student Register
          </Link>
        </div>
      </div>
      <RoleTabs user={user} showGuest />

      <div className="hero">
        <div className="hero-content">
          <p className="eyebrow">Built for focused MDCAT preparation</p>
          <h2>Study smarter, track progress, and master your syllabus</h2>
          <p className="subtitle">
            One platform for lectures, MCQs, and performance insights. Designed to
            keep students consistent and confident.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Student Sign Up
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <h4>120+</h4>
              <p>Recorded lectures</p>
            </div>
            <div>
              <h4>3,000+</h4>
              <p>Topic-wise MCQs</p>
            </div>
            <div>
              <h4>24/7</h4>
              <p>Access on demand</p>
            </div>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-inner">
            <h3>Daily Goal</h3>
            <p>Complete 25 MCQs and review one lecture.</p>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <span className="progress-text">65% done</span>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h3>Platform Highlights</h3>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">L</span>
            <h4>Lectures</h4>
            <p>Access structured lessons with notes and attachments.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">Q</span>
            <h4>MCQs</h4>
            <p>Practice topic-wise questions with instant results.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">A</span>
            <h4>Analytics</h4>
            <p>Track weak topics and improve your score trend.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">C</span>
            <h4>Live Classes</h4>
            <p>Join real-time sessions and ask questions live.</p>
          </div>
        </div>
      </div>

      <div className="sample-section">
        <div className="section-header">
          <div>
            <h3>Sample Course Preview</h3>
            <p>
              Explore the structure before you sign in. Full content unlocks
              after login.
            </p>
          </div>
          <div className="section-actions">
            <Link to="/courses" className="btn btn-secondary">
              View Samples
            </Link>
            <Link to="/login" className="btn btn-primary">
              Login to Unlock
            </Link>
          </div>
        </div>
        <div className="sample-grid">
          {sampleCourses.map((course) => (
            <div className="sample-card" key={course.title}>
              <div className="sample-header">
                <h4>{course.title}</h4>
                <span className="sample-tag">{course.category}</span>
              </div>
              <p>{course.description}</p>
              <div className="sample-meta">
                <span>Instructor: {course.instructor}</span>
                <span>Lessons: {course.lessons}</span>
              </div>
              <div className="sample-footer">
                <span className="sample-pill">Preview Only</span>
                <Link to="/login" className="btn btn-ghost">
                  Login to Enroll
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

