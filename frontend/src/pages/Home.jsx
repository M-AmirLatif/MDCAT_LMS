import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <div className="nav-links">
          <Link to="/login" className="btn btn-login">
            Login
          </Link>
          <Link to="/register" className="btn btn-register">
            Register
          </Link>
        </div>
      </div>

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
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
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
    </div>
  )
}
