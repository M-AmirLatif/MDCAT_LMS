import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ThemeToggle from '../components/ThemeToggle'
import { getAuthUser } from '../services/authStorage'
import { openSocialCommunityModal } from '../components/SocialCommunityModal'
import './Home.css'

const PUBLIC_STATS_CACHE_KEY = 'mdcat-public-stats-v1'

const readCachedPublicStats = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(PUBLIC_STATS_CACHE_KEY) || 'null')
    if (cached?.savedAt < Date.now() - 24 * 60 * 60 * 1000) return undefined
    return cached?.data?.success ? cached.data : undefined
  } catch {
    return undefined
  }
}

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
  if (value === null || value === undefined) return '0'
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

export default function Home() {
  const user = getAuthUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  
  const getSeoContent = () => {
    switch (location.pathname) {
      case '/start-free-mdcat-2026':
      case '/free-mdcat-preparation':
        return {
          title: "Free MDCAT 2026 Preparation | ACEMDCAT",
          desc: "Start your free MDCAT 2026 preparation with chapter-wise MCQs, timed test sessions, detailed explanations, and performance tracking.",
          heading: "Free MDCAT 2026 Preparation",
          subheading: "Faster, Smarter",
          headingLine3: "Preparation at Home",
          p: "Focused MDCAT preparation from the comfort of your home. Real chapters, MCQs, and analytics, all in one platform."
        };
      case '/mdcat-biology-mcqs':
        return {
          title: "Free MDCAT Biology MCQs 2026 | Chapter Wise | ACEMDCAT",
          desc: "Practice chapter-wise Biology MCQs for MDCAT 2026. Real test environment, timer-based quizzes, and detailed explanations.",
          heading: "Free MDCAT Biology MCQs",
          subheading: "Chapter Wise Practice",
          headingLine3: "For MDCAT 2026",
          p: "Master Biology with our extensive collection of chapter-wise MCQs designed for MDCAT 2026.",
          subject: 'Biology',
          benefits: 'Focus on Cellular Life, Human Physiology, and Genetics. Practice timed tests and get instant explanations for Biology concepts.',
          topics: ['Cell Biology', 'Biological Molecules', 'Microbiology', 'Kingdom Animalia', 'Human Physiology', 'Bioenergetics', 'Biotechnology', 'Evolution and Genetics'],
          faq: [
             {q: "Is MDCAT Biology chapter-wise practice free?", a: "Yes, our entire MDCAT Biology MCQ bank is completely free to practice."},
             {q: "Does this cover the PMDC MDCAT 2026 Biology syllabus?", a: "Absolutely. The MCQs are organized strictly according to the latest PMDC MDCAT 2026 Biology syllabus."}
          ]
        };
      case '/mdcat-chemistry-mcqs':
        return {
          title: "Free MDCAT Chemistry MCQs 2026 | Chapter Wise | ACEMDCAT",
          desc: "Practice chapter-wise Chemistry MCQs for MDCAT 2026. Real test environment, timer-based quizzes, and detailed explanations.",
          heading: "Free MDCAT Chemistry MCQs",
          subheading: "Chapter Wise Practice",
          headingLine3: "For MDCAT 2026",
          p: "Master Chemistry with our extensive collection of chapter-wise MCQs designed for MDCAT 2026.",
          subject: 'Chemistry',
          benefits: 'Sharpen your Organic and Inorganic Chemistry concepts. Solve complex equations and conceptual MCQs effortlessly.',
          topics: ['Physical Chemistry', 'Inorganic Chemistry', 'Organic Chemistry', 'Macromolecules', 'Environmental Chemistry', 'Transition Elements'],
          faq: [
             {q: "Are explanations provided for MDCAT Chemistry MCQs?", a: "Yes, detailed explanations and balanced chemical equations are provided after you complete each quiz."},
             {q: "Are the Chemistry MCQs chapter-wise?", a: "Yes, you can select specific chapters like Organic Chemistry or Physical Chemistry to focus your practice."}
          ]
        };
      case '/mdcat-physics-mcqs':
        return {
          title: "Free MDCAT Physics MCQs 2026 | Chapter Wise | ACEMDCAT",
          desc: "Practice chapter-wise Physics MCQs for MDCAT 2026. Real test environment, timer-based quizzes, and detailed explanations.",
          heading: "Free MDCAT Physics MCQs",
          subheading: "Chapter Wise Practice",
          headingLine3: "For MDCAT 2026",
          p: "Master Physics with our extensive collection of chapter-wise MCQs designed for MDCAT 2026.",
          subject: 'Physics',
          benefits: 'Improve your numerical problem-solving speed and conceptual clarity across all MDCAT Physics topics.',
          topics: ['Force and Motion', 'Work and Energy', 'Rotational and Circular Motion', 'Waves', 'Thermodynamics', 'Electrostatics', 'Current Electricity', 'Electromagnetism', 'Modern Physics'],
          faq: [
             {q: "How can I improve my MDCAT Physics numericals?", a: "By practicing with our timed quizzes. Every Physics numerical comes with a step-by-step solution after submission."},
             {q: "Is the MDCAT Physics test bank free?", a: "Yes, all Physics chapters and MCQs are 100% free for MDCAT 2026 students."}
          ]
        };
      case '/mdcat-english-mcqs':
        return {
          title: "Free MDCAT English MCQs 2026 | Chapter Wise | ACEMDCAT",
          desc: "Practice chapter-wise English MCQs for MDCAT 2026. Real test environment, timer-based quizzes, and detailed explanations.",
          heading: "Free MDCAT English MCQs",
          subheading: "Chapter Wise Practice",
          headingLine3: "For MDCAT 2026",
          p: "Master English with our extensive collection of chapter-wise MCQs designed for MDCAT 2026.",
          subject: 'English',
          benefits: 'Enhance your vocabulary, grammar, and sentence structure skills with PMDC-aligned English MCQs.',
          topics: ['Vocabulary', 'Tenses', 'Subject-Verb Agreement', 'Prepositions', 'Articles', 'Sentence Completion', 'Punctuation', 'Spelling'],
          faq: [
             {q: "Does the English section include Vocabulary practice?", a: "Yes, our English bank includes comprehensive vocabulary, synonyms, antonyms, and sentence completion practice."},
             {q: "Is English grammar covered for MDCAT?", a: "Yes, we cover all essential PMDC English grammar rules including subject-verb agreement and prepositions."}
          ]
        };
      case '/about':
        return {
          title: "About ACEMDCAT | Free MDCAT Preparation Platform",
          desc: "Learn about ACEMDCAT, a free platform built to help MDCAT students prepare for their medical entrance exams with chapter-wise MCQs.",
          heading: "About ACEMDCAT",
          subheading: "Our Mission",
          headingLine3: "",
          p: "ACEMDCAT is built to provide high-quality, free MDCAT preparation for every student in Pakistan.",
          staticPage: 'about'
        };
      case '/contact':
        return {
          title: "Contact Us | ACEMDCAT",
          desc: "Get in touch with ACEMDCAT support for any questions regarding your free MDCAT 2026 preparation.",
          heading: "Contact Us",
          subheading: "We're here to help",
          headingLine3: "",
          p: "Have a question or feedback? We'd love to hear from you.",
          staticPage: 'contact'
        };
      case '/privacy-policy':
        return {
          title: "Privacy Policy | ACEMDCAT",
          desc: "Privacy Policy for ACEMDCAT free MDCAT preparation platform.",
          heading: "Privacy Policy",
          subheading: "Data Protection",
          headingLine3: "",
          p: "We take your privacy seriously. Read our policies below.",
          staticPage: 'privacy'
        };
      case '/terms':
        return {
          title: "Terms of Service | ACEMDCAT",
          desc: "Terms of Service for ACEMDCAT free MDCAT preparation platform.",
          heading: "Terms of Service",
          subheading: "User Agreement",
          headingLine3: "",
          p: "Please read these terms carefully before using our platform.",
          staticPage: 'terms'
        };
      default:
        return {
          title: "MDCAT LMS â€“ Free MDCAT 2026 Preparation & MCQs",
          desc: "Prepare for MDCAT 2026 with free chapter-wise Biology, Chemistry, Physics, and English MCQs, timed tests, explanations, and performance tracking.",
          heading: "MDCAT 2026:",
          subheading: "Faster, Smarter",
          headingLine3: "Preparation at Home",
          p: "Focused MDCAT preparation from the comfort of your home. Real chapters, MCQs, and analytics, all in one platform."
        };
    }
  }

  const seo = getSeoContent()
  const canonicalUrl = "https://www.acemdcat.com" + (location.pathname === '/' ? '' : location.pathname)

  const statsQuery = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const response = await fetch('/api/public/stats', {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Unable to load public statistics')
      const data = await response.json()
      if (data?.success) {
        localStorage.setItem(PUBLIC_STATS_CACHE_KEY, JSON.stringify({
          savedAt: Date.now(),
          data,
        }))
      }
      return data?.success ? data : null
    },
    initialData: readCachedPublicStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
  const stats = statsQuery.data

  const statItems = [
    [String(stats?.subjects ?? 4), 'MDCAT Subjects', 'people'],
    [formatStat(stats?.totalChapters ?? null), 'Published Chapters', 'chart'],
    [formatStat(stats?.totalMcqs ?? null), 'Published MCQs', 'medical'],
    [formatStat(stats?.totalAttempts ?? null), 'Student Attempts', 'trophy'],
  ]

  const hasContent = stats && (stats.totalChapters > 0 || stats.totalMcqs > 0)

  return (
    <main className="landing">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.desc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.desc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.desc} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "ACEMDCAT",
              "url": "https://www.acemdcat.com",
              "description": "Free MDCAT 2026 Preparation Platform with chapter-wise MCQs for Biology, Chemistry, Physics, and English."
            }
          `}
        </script>

        {seo.faq && seo.faq.length > 0 && (
          <script type="application/ld+json">
            {`
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": ${JSON.stringify(
                  seo.faq.map((f) => ({
                    "@type": "Question",
                    "name": f.q,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": f.a
                    }
                  }))
                )}
              }
            `}
          </script>
        )}
      </Helmet>
      
      <header className="lp-nav">
        <Link className="lp-brand" to="/">
          <span className="lp-mark">M</span>
          <span>MDCAT LMS</span>
        </Link>
        <nav className={`lp-links ${menuOpen ? 'lp-links--open' : ''}`} aria-label="Public navigation">
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#subjects" onClick={() => setMenuOpen(false)}>Subjects</a>
          <a href="#flps" onClick={() => setMenuOpen(false)}>FLPs</a>
          <a href="#past-papers" onClick={() => setMenuOpen(false)}>Past Papers</a>
          <Link to="/flashcards" onClick={() => setMenuOpen(false)}>Flashcards</Link>
          <Link to="/past-papers/nums-2026-answer-key" onClick={() => setMenuOpen(false)} style={{ color: '#38bdf8', fontWeight: 700 }}>NUMS 2026 Key 🔥</Link>
          <button
            type="button"
            className="lp-community-pill"
            onClick={() => {
              setMenuOpen(false)
              openSocialCommunityModal()
            }}
            title="Official WhatsApp Channels & Discussion Groups"
          >
            <span className="topbar-community-dot" />
            <span>WhatsApp Groups 📢</span>
          </button>
          <div className="lp-mobile-actions">
            {user ? (
              <Link className="lp-btn lp-btn-primary" to="/dashboard" onClick={() => setMenuOpen(false)}>Go to Dashboard</Link>
            ) : (
              <>
                <Link className="lp-btn lp-btn-ghost" to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link className="lp-btn lp-btn-primary" to="/register" onClick={() => setMenuOpen(false)}>Join Now</Link>
              </>
            )}
          </div>
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
        <button
          className={`lp-menu-toggle ${menuOpen ? 'lp-menu-toggle--active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
          aria-label="Toggle navigation menu"
        >
          <span className="lp-menu-bar"></span>
          <span className="lp-menu-bar"></span>
          <span className="lp-menu-bar"></span>
        </button>
      </header>

      <section id="home" className="lp-hero">
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
          <strong>Join the batch first</strong>
        </div>

        <div className="lp-hero-content reveal">
          <Link
            to="/past-papers/nums-2026-answer-key"
            className="lp-batch-pill"
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(2, 132, 199, 0.15))',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              marginBottom: '1rem',
              display: 'inline-flex',
              fontWeight: 700,
            }}
          >
            <span style={{ marginRight: '6px' }}>🔥</span> NUMS MDCAT 2026 Official Answer Key & Solved Paper is OUT! Check Score →
          </Link>
          <div className="lp-batch-pill"><i /> MDCAT 2026 Batch Now Open</div>
          <h1>
            <span>{seo.heading}</span>
            <span className="lp-gradient-text">{seo.subheading}</span>
            {seo.headingLine3 && <span>{seo.headingLine3}</span>}
          </h1>
          <p>{seo.p}</p>
          <div className="lp-hero-ctas">
            <Link className="lp-btn lp-btn-primary" to="/mcqs">Explore All Subjects</Link>
            <Link className="lp-btn lp-btn-teal" to="/mcqs/flps">Attempt Full Length Papers (FLPs)</Link>
            <Link className="lp-btn lp-btn-ghost" to="/mcqs/past-papers">Past Papers Hub</Link>
          </div>
          <div className="lp-student-line">100% Free Access to All Chapters, FLPs, and Solved Past Papers for Every Student</div>
        </div>
      </section>

      {seo.subject && (
        <section className="lp-section lp-section-light" style={{ paddingBottom: 0 }}>
          <div className="lp-container reveal">
            <h2 className="lp-section-title">Why Practice MDCAT {seo.subject} with Us?</h2>
            <p style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-muted, #4b5563)' }}>{seo.benefits}</p>
            
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{seo.subject} Syllabus Topics Covered</h3>
            <div className="lp-faq-grid" style={{ marginBottom: '60px' }}>
              {seo.topics?.map(topic => (
                <div className="lp-faq-item" key={topic} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontWeight: 'bold' }}>
                  {topic}
                </div>
              ))}
            </div>

            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{seo.subject} FAQs</h3>
            <div className="lp-faq-grid" style={{ marginBottom: '40px' }}>
              {seo.faq?.map((f, i) => (
                <div className="lp-faq-item" key={i}>
                  <strong>{f.q}</strong>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px' }}>
               <Link className="lp-btn lp-btn-primary" to="/mcqs">Start {seo.subject} Practice Now</Link>
            </div>
          </div>
        </section>
      )}

      {seo.staticPage && (
        <section className="lp-section lp-section-light" style={{ paddingBottom: '80px', paddingTop: '40px' }}>
          <div className="lp-container reveal" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', lineHeight: '1.8', color: 'var(--text-color, #1f2937)' }}>
            {seo.staticPage === 'about' && (
              <>
                <h2>Our Story</h2>
                <p>Welcome to ACEMDCAT, Pakistan's premier free platform for MDCAT preparation. Founded by passionate educators, our mission is to democratize access to high-quality medical entrance exam resources.</p>
                <br />
                <h2>Why We Built This</h2>
                <p>MDCAT preparation is often expensive and stressful. We believe that every student, regardless of their financial background, deserves a fair shot at getting into their dream medical college. That's why we've built a comprehensive, chapter-wise MCQ bank that perfectly aligns with the latest PMDC syllabus—completely free of charge.</p>
                <br />
                <h2>What We Offer</h2>
                <ul>
                  <li><strong>Chapter-Wise MCQs:</strong> Thousands of questions spanning Biology, Chemistry, Physics, and English.</li>
                  <li><strong>Real-Time Analytics:</strong> Track your daily streaks, weak chapters, and overall performance.</li>
                  <li><strong>Detailed Explanations:</strong> Learn from your mistakes instantly with clear, step-by-step solutions for numericals and conceptual questions.</li>
                </ul>
              </>
            )}
            
            {seo.staticPage === 'contact' && (
              <>
                <h2>Get in Touch</h2>
                <p>We are always here to help you on your journey to becoming a medical professional. Whether you have a question about our platform, need technical support, or want to share feedback, we'd love to hear from you!</p>
                <br />
                <h2>Contact Information</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li>💬 <strong>WhatsApp Channel:</strong> <a href="https://whatsapp.com/channel/0029Vb8KYZK9RZAUyyUEIf1C" target="_blank" rel="noopener noreferrer">Follow Official Channel</a></li>
                  <li>📞 <strong>WhatsApp Support:</strong> 03074172603</li>
                  <li>📍 <strong>Location:</strong> Online Platform for all Pakistani Students</li>
                </ul>
                <br />
                <p>We aim to respond to all inquiries within 24 hours.</p>
              </>
            )}

            {seo.staticPage === 'privacy' && (
              <>
                <h2>1. Information We Collect</h2>
                <p>We collect basic information required to provide our LMS services, including your name, email address, and performance data on quizzes (such as scores and time taken). We do not collect sensitive payment information directly on our servers.</p>
                <br />
                <h2>2. How We Use Your Data</h2>
                <p>Your data is strictly used to improve your educational experience. We use quiz results to generate your personalized analytics dashboard and streak trackers. We do not sell your personal data to third-party marketing companies.</p>
                <br />
                <h2>3. Cookies and Tracking</h2>
                <p>We use standard session cookies for authenticating your account, and Google Analytics to understand how visitors interact with our public pages. These tools help us improve platform speed and usability.</p>
                <br />
                <h2>4. Data Security</h2>
                <p>All passwords are encrypted and our servers employ modern security practices to ensure your data remains safe and private.</p>
              </>
            )}

            {seo.staticPage === 'terms' && (
              <>
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using ACEMDCAT, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform.</p>
                <br />
                <h2>2. Educational Use Only</h2>
                <p>All MCQs, explanations, and content provided on this platform are for educational and preparation purposes. While we strive for 100% accuracy, we do not guarantee admission into any medical institution based solely on the usage of our platform.</p>
                <br />
                <h2>3. User Conduct</h2>
                <p>You agree to use the platform respectfully. Any attempt to scrape our MCQ database, manipulate leaderboards, or share premium accounts (if applicable) will result in immediate account termination.</p>
                <br />
                <h2>4. Intellectual Property</h2>
                <p>All website design, structure, and original content are the intellectual property of ACEMDCAT. You may not reproduce, distribute, or create derivative works without explicit permission.</p>
              </>
            )}
          </div>
        </section>
      )}

      {!seo.staticPage && (
        <>
          {/* ═══════════════════════════════════════════════════
              SECTION 1: CORE MDCAT SUBJECTS (CHAPTER PRACTICE)
              ═══════════════════════════════════════════════════ */}
          <section id="subjects" className="lp-section lp-section-light">
            <div className="lp-container reveal">
              <div className="lp-section-header">
                <span className="lp-badge-pill">PMDC SYLLABUS 2026</span>
                <h2 className="lp-section-title">Core MDCAT Subjects Practice</h2>
                <p className="lp-section-desc">
                  Select any subject to access complete chapter-wise MCQ banks, timed tests, and instant step-by-step explanations.
                </p>
              </div>

              <div className="lp-subjects-grid">
                {/* Biology Card */}
                <article className="lp-subject-card lp-subject-card--bio">
                  <div className="lp-subject-card-top">
                    <span className="lp-subject-icon">🧬</span>
                    <span className="lp-subject-weight">68 MCQs · 34% Weightage</span>
                  </div>
                  <h3 className="lp-subject-title">Biology</h3>
                  <p className="lp-subject-desc">
                    Cell Biology, Biological Molecules, Human Physiology, Genetics, Bioenergetics, Coordination & Evolution.
                  </p>
                  <div className="lp-subject-tags">
                    <span>Cell Structure</span>
                    <span>Physiology</span>
                    <span>Genetics</span>
                    <span>Bioenergetics</span>
                  </div>
                  <div className="lp-subject-card-footer">
                    <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/mcqs/biology">
                      Practice Biology MCQs →
                    </Link>
                  </div>
                </article>

                {/* Chemistry Card */}
                <article className="lp-subject-card lp-subject-card--chem">
                  <div className="lp-subject-card-top">
                    <span className="lp-subject-icon">⚗️</span>
                    <span className="lp-subject-weight">54 MCQs · 27% Weightage</span>
                  </div>
                  <h3 className="lp-subject-title">Chemistry</h3>
                  <p className="lp-subject-desc">
                    Physical Chemistry, Atomic Structure, Chemical Bonding, Organic Reaction Mechanisms, Hydrocarbons & Biomolecules.
                  </p>
                  <div className="lp-subject-tags">
                    <span>Organic Chem</span>
                    <span>Chemical Bonding</span>
                    <span>Equilibrium</span>
                    <span>Reactions</span>
                  </div>
                  <div className="lp-subject-card-footer">
                    <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/mcqs/chemistry">
                      Practice Chemistry MCQs →
                    </Link>
                  </div>
                </article>

                {/* Physics Card */}
                <article className="lp-subject-card lp-subject-card--phy">
                  <div className="lp-subject-card-top">
                    <span className="lp-subject-icon">⚡</span>
                    <span className="lp-subject-weight">54 MCQs · 27% Weightage</span>
                  </div>
                  <h3 className="lp-subject-title">Physics</h3>
                  <p className="lp-subject-desc">
                    Mechanics, Work & Energy, Thermodynamics, Electrostatics, Current Electricity, Electromagnetism & Modern Physics.
                  </p>
                  <div className="lp-subject-tags">
                    <span>Force & Motion</span>
                    <span>Thermodynamics</span>
                    <span>Electrostatics</span>
                    <span>Circuits</span>
                  </div>
                  <div className="lp-subject-card-footer">
                    <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/mcqs/physics">
                      Practice Physics MCQs →
                    </Link>
                  </div>
                </article>

                {/* English Card */}
                <article className="lp-subject-card lp-subject-card--eng">
                  <div className="lp-subject-card-top">
                    <span className="lp-subject-icon">📖</span>
                    <span className="lp-subject-weight">18 MCQs · 9% Weightage</span>
                  </div>
                  <h3 className="lp-subject-title">English</h3>
                  <p className="lp-subject-desc">
                    High-yield Vocabulary in context, Subject-Verb Agreement, Tenses, Sentence Correction, Prepositions & Punctuation.
                  </p>
                  <div className="lp-subject-tags">
                    <span>Vocabulary</span>
                    <span>Grammar Rules</span>
                    <span>Sentence Completion</span>
                    <span>Tenses</span>
                  </div>
                  <div className="lp-subject-card-footer">
                    <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/mcqs/english">
                      Practice English MCQs →
                    </Link>
                  </div>
                </article>

                {/* Logical Reasoning Card */}
                <article className="lp-subject-card lp-subject-card--logic">
                  <div className="lp-subject-card-top">
                    <span className="lp-subject-icon">🧠</span>
                    <span className="lp-subject-weight">6 MCQs · 3% Weightage</span>
                  </div>
                  <h3 className="lp-subject-title">Logical Reasoning</h3>
                  <p className="lp-subject-desc">
                    Critical Thinking, Syllogisms, Deduction, Course of Action, Letter & Symbol Series, Cause & Effect problems.
                  </p>
                  <div className="lp-subject-tags">
                    <span>Critical Thinking</span>
                    <span>Syllogisms</span>
                    <span>Deduction</span>
                    <span>Series</span>
                  </div>
                  <div className="lp-subject-card-footer">
                    <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/mcqs/logical-reasoning">
                      Practice Logical Reasoning →
                    </Link>
                  </div>
                </article>
              </div>

              <div className="lp-section-cta">
                <Link className="lp-btn lp-btn-ghost lp-btn-wide-cta" to="/mcqs">
                  Browse All Chapters & Subjects Bank →
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════
              SECTION 2: FULL LENGTH PAPERS (FLPs)
              ═══════════════════════════════════════════════════ */}
          <section id="flps" className="lp-section lp-section-dark">
            <div className="lp-container reveal">
              <div className="lp-section-header">
                <span className="lp-badge-pill lp-badge-pill--green">EXAM SIMULATOR</span>
                <h2 className="lp-section-title lp-section-title-dark">Full Length Mock Papers (FLPs)</h2>
                <p className="lp-section-desc lp-section-desc-dark">
                  Experience exact PMDC exam conditions with 200 MCQs, 3.5-hour real-time countdown timer, negative marking calculator, and deep performance review.
                </p>
              </div>

              <div className="lp-flps-grid">
                <div className="lp-flp-card">
                  <div className="lp-flp-badge">Full Syllabus 2026</div>
                  <h3 className="lp-flp-title">MDCAT FLP 1 — Comprehensive Mock</h3>
                  <div className="lp-flp-meta">
                    <span>⏱️ 210 Minutes (3.5 Hours)</span>
                    <span>📝 200 Questions</span>
                    <span>🎯 Full PMDC Standard</span>
                  </div>
                  <div className="lp-flp-breakdown">
                    <b>Bio: 68</b><b>Chem: 54</b><b>Phy: 54</b><b>Eng: 18</b><b>Logic: 6</b>
                  </div>
                  <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/mcqs/flps">
                    Start FLP 1 Attempt →
                  </Link>
                </div>

                <div className="lp-flp-card">
                  <div className="lp-flp-badge lp-flp-badge--amber">High-Yield Standard</div>
                  <h3 className="lp-flp-title">MDCAT FLP 2 — Advanced Mock</h3>
                  <div className="lp-flp-meta">
                    <span>⏱️ 210 Minutes (3.5 Hours)</span>
                    <span>📝 200 Questions</span>
                    <span>🎯 High Difficulty Mix</span>
                  </div>
                  <div className="lp-flp-breakdown">
                    <b>Bio: 68</b><b>Chem: 54</b><b>Phy: 54</b><b>Eng: 18</b><b>Logic: 6</b>
                  </div>
                  <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/mcqs/flps">
                    Start FLP 2 Attempt →
                  </Link>
                </div>

                <div className="lp-flp-card">
                  <div className="lp-flp-badge lp-flp-badge--purple">Speed & Stamina</div>
                  <h3 className="lp-flp-title">MDCAT FLP 3 — Speed Simulation</h3>
                  <div className="lp-flp-meta">
                    <span>⏱️ 210 Minutes (3.5 Hours)</span>
                    <span>📝 200 Questions</span>
                    <span>🎯 Time Management Focus</span>
                  </div>
                  <div className="lp-flp-breakdown">
                    <b>Bio: 68</b><b>Chem: 54</b><b>Phy: 54</b><b>Eng: 18</b><b>Logic: 6</b>
                  </div>
                  <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/mcqs/flps">
                    Start FLP 3 Attempt →
                  </Link>
                </div>
              </div>

              <div className="lp-section-cta">
                <Link className="lp-btn lp-btn-teal" to="/mcqs/flps">
                  View All Full Length Papers (FLPs) →
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════
              SECTION 3: PAST PAPERS & ANSWER KEYS
              ═══════════════════════════════════════════════════ */}
          <section id="past-papers" className="lp-section lp-section-light">
            <div className="lp-container reveal">
              <div className="lp-section-header">
                <span className="lp-badge-pill">ALL PROVINCES & BOARDS</span>
                <h2 className="lp-section-title">Past Papers & Solved Keys</h2>
                <p className="lp-section-desc">
                  Practice authentic past entrance examination papers from NUMS, UHS, SZABMU, DUHS, KMU, and BUMHS with detailed answer keys.
                </p>
              </div>

              <div className="lp-pastpapers-grid">
                <Link to="/past-papers/nums-2026-answer-key" className="lp-pastpaper-card lp-pastpaper-card--featured">
                  <div className="lp-pastpaper-tag">🔥 Latest Official 2026</div>
                  <h3 className="lp-pastpaper-title">NUMS MDCAT 2026 Solved Paper & Answer Key</h3>
                  <p className="lp-pastpaper-desc">
                    Complete official answer key and fully solved test questions with step-by-step reasoning.
                  </p>
                  <span className="lp-pastpaper-link">Check Solved Key & Score →</span>
                </Link>

                <Link to="/mcqs/past-papers" className="lp-pastpaper-card">
                  <div className="lp-pastpaper-tag">Punjab Board</div>
                  <h3 className="lp-pastpaper-title">UHS MDCAT Past Papers</h3>
                  <p className="lp-pastpaper-desc">
                    Original question papers from 2018 to 2025 organized by chapter and full past papers.
                  </p>
                  <span className="lp-pastpaper-link">Practice UHS Papers →</span>
                </Link>

                <Link to="/mcqs/past-papers" className="lp-pastpaper-card">
                  <div className="lp-pastpaper-tag">Federal / ICT</div>
                  <h3 className="lp-pastpaper-title">SZABMU MDCAT Past Papers</h3>
                  <p className="lp-pastpaper-desc">
                    Federal and Islamabad capital territory entrance exam papers with detailed explanations.
                  </p>
                  <span className="lp-pastpaper-link">Practice SZABMU Papers →</span>
                </Link>

                <Link to="/mcqs/past-papers" className="lp-pastpaper-card">
                  <div className="lp-pastpaper-tag">Sindh Board</div>
                  <h3 className="lp-pastpaper-title">DUHS / JSMU MDCAT Past Papers</h3>
                  <p className="lp-pastpaper-desc">
                    Sindh MDCAT past questions strictly aligned with IBA Sukkur and Dow University patterns.
                  </p>
                  <span className="lp-pastpaper-link">Practice Sindh Papers →</span>
                </Link>

                <Link to="/mcqs/past-papers" className="lp-pastpaper-card">
                  <div className="lp-pastpaper-tag">KPK Board</div>
                  <h3 className="lp-pastpaper-title">KMU MDCAT Past Papers</h3>
                  <p className="lp-pastpaper-desc">
                    Khyber Medical University past entrance papers with instant performance diagnostics.
                  </p>
                  <span className="lp-pastpaper-link">Practice KMU Papers →</span>
                </Link>

                <Link to="/mcqs/past-papers" className="lp-pastpaper-card">
                  <div className="lp-pastpaper-tag">Balochistan</div>
                  <h3 className="lp-pastpaper-title">BUMHS MDCAT Past Papers</h3>
                  <p className="lp-pastpaper-desc">
                    Bolan University of Medical & Health Sciences past entrance test questions with solutions.
                  </p>
                  <span className="lp-pastpaper-link">Practice BUMHS Papers →</span>
                </Link>
              </div>

              <div className="lp-section-cta">
                <Link className="lp-btn lp-btn-primary" to="/mcqs/past-papers">
                  Access Complete Past Papers Bank →
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════
              SECTION 4: ESSENTIAL TOOLS & FEATURES
              ═══════════════════════════════════════════════════ */}
          <section id="tools" className="lp-section lp-section-dark">
            <div className="lp-container reveal">
              <div className="lp-section-header">
                <span className="lp-badge-pill lp-badge-pill--purple">SMART PREP ECOSYSTEM</span>
                <h2 className="lp-section-title lp-section-title-dark">Everything You Need to Ace MDCAT</h2>
                <p className="lp-section-desc lp-section-desc-dark">
                  Beyond MCQs: Active recall tools, national rankings, timer-based simulators, and live study groups.
                </p>
              </div>

              <div className="lp-tools-grid">
                <div className="lp-tool-card">
                  <div className="lp-tool-icon">⚡</div>
                  <h3 className="lp-tool-title">Interactive Flashcards</h3>
                  <p className="lp-tool-desc">
                    Rapid memory recall for Physics formula sheets, Biology terminology, and Organic reactions.
                  </p>
                  <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/flashcards">
                    Open Flashcards →
                  </Link>
                </div>

                <div className="lp-tool-card">
                  <div className="lp-tool-icon">📊</div>
                  <h3 className="lp-tool-title">Performance Analytics</h3>
                  <p className="lp-tool-desc">
                    Identify your weakest chapters, review error patterns, and monitor your daily streak.
                  </p>
                  <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/performance">
                    View Analytics →
                  </Link>
                </div>

                <div className="lp-tool-card">
                  <div className="lp-tool-icon">🏆</div>
                  <h3 className="lp-tool-title">National Leaderboard</h3>
                  <p className="lp-tool-desc">
                    See where you stand among thousands of MDCAT aspirants across Pakistan in real-time.
                  </p>
                  <Link className="lp-btn lp-btn-primary lp-btn-sm" to="/leaderboard">
                    Check Leaderboard →
                  </Link>
                </div>

                <div className="lp-tool-card">
                  <div className="lp-tool-icon">📢</div>
                  <h3 className="lp-tool-title">WhatsApp Communities</h3>
                  <p className="lp-tool-desc">
                    Official PMDC news, daily challenge questions, and peer-to-peer discussion groups.
                  </p>
                  <button
                    type="button"
                    className="lp-btn lp-btn-teal lp-btn-sm"
                    onClick={openSocialCommunityModal}
                  >
                    Join WhatsApp Groups →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════
              SECTION 5: STATS & HIGHLIGHTS
              ═══════════════════════════════════════════════════ */}
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

          {/* ═══════════════════════════════════════════════════
              SECTION 6: FAQ
              ═══════════════════════════════════════════════════ */}
          <section id="faq" className="lp-section lp-section-light">
            <div className="lp-container reveal">
              <div className="lp-section-header">
                <span className="lp-badge-pill">GOT QUESTIONS?</span>
                <h2 className="lp-section-title">Frequently Asked Questions</h2>
              </div>
              <div className="lp-faq-grid">
                <div className="lp-faq-item">
                  <strong>Is ACEMDCAT 100% free?</strong>
                  <p>Yes, all chapter-wise MCQs, Full Length Papers (FLPs), and Past Papers are completely free for all MDCAT 2026 aspirants.</p>
                </div>
                <div className="lp-faq-item">
                  <strong>Can I practice MDCAT MCQs chapter-wise?</strong>
                  <p>Absolutely! Biology, Chemistry, Physics, English, and Logical Reasoning are neatly broken down into individual topics and chapters.</p>
                </div>
                <div className="lp-faq-item">
                  <strong>Are explanations provided for each MCQ?</strong>
                  <p>Yes, comprehensive explanations with numerical steps and conceptual reasoning are provided after each test session.</p>
                </div>
                <div className="lp-faq-item">
                  <strong>Do tests simulate actual PMDC timings?</strong>
                  <p>Yes, both chapter practice tests and Full Length Papers (FLPs) include real-time countdown timers and question review navigators.</p>
                </div>
                <div className="lp-faq-item">
                  <strong>Can I resume my test if my browser closes?</strong>
                  <p>Yes! Your quiz progress, timer, and selected answers are saved in real-time so you never lose your attempt.</p>
                </div>
                <div className="lp-faq-item">
                  <strong>How can I join the official WhatsApp student groups?</strong>
                  <p>Click the "WhatsApp Groups 📢" button in the top navigation to follow our official channel and join the student discussion group.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════
              SECTION 7: FINAL CTA
              ═══════════════════════════════════════════════════ */}
          <section className="lp-final-cta">
            <div className="lp-grid-bg" />
            <h2>Ready to Start Your MDCAT Journey?</h2>
            <p>Join thousands of medical aspirants preparing smarter with chapter-wise MCQs, FLPs, and solved past papers.</p>
            <div className="lp-hero-ctas">
              <Link className="lp-btn lp-btn-white" to="/register">Create Free Account</Link>
              <Link className="lp-btn lp-btn-ghost" to="/mcqs">Start Practicing Now</Link>
            </div>
          </section>
        </>
      )}

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-mark">M</span>
            <div>
              <strong>MDCAT LMS</strong>
              <small>Your Complete Free MDCAT Prep Platform</small>
            </div>
          </div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/mcqs">Subjects</Link>
            <Link to="/mcqs/flps">FLPs (Mock Tests)</Link>
            <Link to="/mcqs/past-papers">Past Papers</Link>
            <Link to="/flashcards">Flashcards</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </nav>
          <p>© 2026 MDCAT LMS — Built for Medical Entrance Success</p>
        </div>
      </footer>
    </main>
  )
}







