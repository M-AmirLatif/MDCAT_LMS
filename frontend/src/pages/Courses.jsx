import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthToken, getAuthUser } from '../services/authStorage'
import './Courses.css'

const CATEGORIES = [
  'All',
  'Biology',
  'Chemistry',
  'Physics',
  'English',
]

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const navigate = useNavigate()
  const user = getAuthUser()
  const isGuest = !user?.role
  const sampleCourses = [
    {
      _id: 'sample-bio',
      name: 'MDCAT Biology Foundations',
      description:
        'Concept-first lessons with diagrams, flashcards, and daily recall tests.',
      category: 'Biology',
      createdBy: { firstName: 'Dr. Ayesha', lastName: 'Khan' },
      enrolledCount: 1240,
      isSample: true,
    },
    {
      _id: 'sample-chem',
      name: 'MDCAT Chemistry Numericals',
      description:
        'Practice-heavy modules with guided problem solving and quick formulas.',
      category: 'Chemistry',
      createdBy: { firstName: 'Sana', lastName: 'Malik' },
      enrolledCount: 980,
      isSample: true,
    },
    {
      _id: 'sample-phys',
      name: 'MDCAT Physics Sprint',
      description:
        'High-yield revision plan focused on motion, waves, and quick tricks.',
      category: 'Physics',
      createdBy: { firstName: 'Amir', lastName: 'Latif' },
      enrolledCount: 860,
      isSample: true,
    },
  ]

  useEffect(() => {
    if (isGuest) {
      setCourses(sampleCourses)
      setLoading(false)
      return
    }
    fetchCourses()
  }, [isGuest]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCourses = async () => {
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (category !== 'All') params.category = category

      const res = await API.get('/courses', { params })
      setCourses(res.data.courses)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch when search or category changes (for authenticated users)
  useEffect(() => {
    if (isGuest) return
    const timer = setTimeout(() => {
      fetchCourses()
    }, 400) // debounce search
    return () => clearTimeout(timer)
  }, [search, category]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnroll = async (courseId) => {
    try {
      const token = getAuthToken()
      if (!token) {
        navigate('/login')
        return
      }

      await API.post(`/courses/${courseId}/enroll`)
      alert('Enrolled successfully!')
      navigate(`/course/${courseId}`)
    } catch (error) {
      alert('Error enrolling: ' + error.response?.data?.error)
    }
  }

  // Client-side filter for guests
  const displayCourses = isGuest
    ? courses.filter((c) => {
        const matchCategory = category === 'All' || c.category === category
        const matchSearch =
          !search.trim() ||
          c.name.toLowerCase().includes(search.trim().toLowerCase())
        return matchCategory && matchSearch
      })
    : courses

  if (loading)
    return (
      <div className="courses">
        <p>Loading courses...</p>
      </div>
    )

  return (
    <div className="courses">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(isGuest ? '/login' : '/dashboard')}>
          {isGuest ? 'Login' : 'Dashboard'}
        </button>
      </div>
      <RoleTabs user={user} showGuest />

      <div className="courses-container">
        <div className="header-row">
          <div>
            <h2>Available Courses</h2>
            <p>
              {isGuest
                ? 'Preview sample courses. Login to access full content.'
                : 'Enroll in a course and start learning today.'}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="course-search"
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => setSearch('')}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
          <div className="category-filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`cat-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="courses-grid">
          {displayCourses.length > 0 ? (
            displayCourses.map((course) => (
              <div
                key={course._id}
                className={`course-card ${course.isSample ? 'sample' : ''}`}
                onClick={() => {
                  if (course.isSample) return
                  navigate(`/course/${course._id}`)
                }}
                style={{ cursor: course.isSample ? 'default' : 'pointer' }}
              >
                <div className="course-card-header">
                  <h3>{course.name}</h3>
                  <span className="category">{course.category}</span>
                </div>
                <p className="description">{course.description}</p>
                <p className="instructor">
                  By: {course.createdBy?.firstName} {course.createdBy?.lastName}
                </p>
                <p className="students">
                  Students: {course.enrolledCount ?? course.enrolledStudents?.length ?? 0}
                </p>
                {course.price > 0 && (
                  <p className="price-tag">PKR {course.price}</p>
                )}
                <button
                  className="enroll-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (course.isSample) {
                      navigate('/login')
                      return
                    }
                    handleEnroll(course._id)
                  }}
                >
                  {course.isSample ? 'Login to Enroll' : 'Enroll Now'}
                </button>
              </div>
            ))
          ) : (
            <div className="no-courses">
              <p>No courses found{search ? ` for "${search}"` : ''}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
