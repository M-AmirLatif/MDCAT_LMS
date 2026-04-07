import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import './Courses.css'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await API.get('/courses')
      setCourses(res.data.courses)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
    try {
      const token = localStorage.getItem('token')
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
        <button onClick={() => navigate('/dashboard')}>Dashboard</button>
      </div>

      <div className="courses-container">
        <div className="header-row">
          <div>
            <h2>Available Courses</h2>
            <p>Enroll in a course and start learning today.</p>
          </div>
        </div>
        <div className="courses-grid">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div
                key={course._id}
                className="course-card"
                onClick={() => navigate(`/course/${course._id}`)}
                style={{ cursor: 'pointer' }}
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
                <button
                  className="enroll-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEnroll(course._id)
                  }}
                >
                  Enroll Now
                </button>
              </div>
            ))
          ) : (
            <p>No courses available</p>
          )}
        </div>
      </div>
    </div>
  )
}

