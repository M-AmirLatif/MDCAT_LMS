import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      <div className="navbar">
        <h1>🎓 MDCAT LMS</h1>
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
        <h2>Welcome to MDCAT Learning Platform</h2>
        <p>Your all-in-one solution for MDCAT preparation</p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign In
          </Link>
        </div>
      </div>

      <div className="features-section">
        <h3>Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <span>📚</span>
            <h4>Lectures</h4>
            <p>Access recorded and live lectures</p>
          </div>
          <div className="feature-card">
            <span>📝</span>
            <h4>MCQs</h4>
            <p>Topic-wise multiple choice questions</p>
          </div>
          <div className="feature-card">
            <span>📊</span>
            <h4>Analytics</h4>
            <p>Track your progress and performance</p>
          </div>
          <div className="feature-card">
            <span>🎥</span>
            <h4>Live Classes</h4>
            <p>Join live sessions with instructors</p>
          </div>
        </div>
      </div>
    </div>
  )
}
