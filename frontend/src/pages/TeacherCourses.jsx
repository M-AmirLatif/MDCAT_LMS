import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import './TeacherCourses.css'

export default function TeacherCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const res = await API.get('/courses/teacher/my-courses')
        setCourses(res.data.courses || [])
      } catch (err) {
        setError('Failed to load your courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [navigate])

  if (loading)
    return (
      <div className="teacher-courses">
        <p>Loading courses...</p>
      </div>
    )

  return (
    <div className="teacher-courses">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/dashboard')}>Dashboard</button>
      </div>
      <RoleTabs user={user} />

      <div className="teacher-courses-container">
        <div className="header-row">
          <h2>My Courses</h2>
          <button onClick={() => navigate('/teacher/courses/create')}>
            Create Course
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {courses.length === 0 ? (
          <p>No courses created yet.</p>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <div key={course._id} className="course-card">
                <h3>{course.name}</h3>
                <p className="category">{course.category}</p>
                <p className="description">{course.description}</p>
                <p className="status">
                  Status: {course.isPublished ? 'Published' : 'Draft'}
                </p>
                <div className="actions">
                  <button
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    View
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() =>
                      navigate(`/teacher/courses/${course._id}/edit`)
                    }
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


