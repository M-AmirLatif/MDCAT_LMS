import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import './CourseDetail.css'

export default function CourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  useEffect(() => {
    fetchCourseAndLectures()
  }, [courseId])

  const fetchCourseAndLectures = async () => {
    try {
      const courseRes = await API.get(`/courses/${courseId}`)
      setCourse(courseRes.data.course)

      const lecturesRes = await API.get(`/lectures/course/${courseId}`)
      setLectures(lecturesRes.data.lectures)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="course-detail">
        <p>Loading...</p>
      </div>
    )

  if (!course)
    return (
      <div className="course-detail">
        <p>Course not found</p>
      </div>
    )

  return (
    <div className="course-detail">
      <div className="navbar">
        <h1>🎓 MDCAT LMS</h1>
        <button onClick={() => navigate('/courses')}>← Back to Courses</button>
      </div>

      <div className="course-detail-container">
        <div className="course-header">
          <h2>{course.name}</h2>
          <p className="category">📚 {course.category}</p>
          <p className="description">{course.description}</p>
          <p className="instructor">
            Instructor: {course.createdBy?.firstName}{' '}
            {course.createdBy?.lastName}
          </p>
          <p className="students">
            👥 {course.enrolledCount ?? course.enrolledStudents?.length ?? 0} students enrolled
          </p>
        </div>

        <div className="topics-section">
          <h3>Topics Covered</h3>
          <ul className="topics-list">
            {course.topics?.map((topic, idx) => (
              <li key={idx}>
                <strong>{topic.name}</strong>
                {topic.description && <p>{topic.description}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="mcq-section">
          <div className="mcq-header">
            <h3>MCQ Tests</h3>
            <div className="mcq-actions">
              <button onClick={() => navigate(`/course/${courseId}/mcqs`)}>
                Start MCQ Test
              </button>
              {isTeacher && (
                <button
                  className="create-mcq-btn"
                  onClick={() => navigate(`/course/${courseId}/create-mcq`)}
                >
                  Add MCQ
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lectures-section">
          <div className="lectures-header">
            <h3>📹 Lectures ({lectures.length})</h3>
            {isTeacher && (
              <button
                className="create-lecture-btn"
                onClick={() => navigate(`/course/${courseId}/create-lecture`)}
              >
                Add Lecture
              </button>
            )}
          </div>
          {lectures.length > 0 ? (
            <div className="lectures-list">
              {lectures.map((lecture) => (
                <div key={lecture._id} className="lecture-item">
                  <div className="lecture-info">
                    <h4>{lecture.title}</h4>
                    <p className="topic">Topic: {lecture.topic}</p>
                    <p className="description">{lecture.description}</p>
                    <div className="lecture-meta">
                      <span>👁️ {lecture.views} views</span>
                      <span>⏱️ {Math.floor(lecture.videoDuration / 60)}m</span>
                    </div>
                  </div>
                  <button
                    className="watch-btn"
                    onClick={() => navigate(`/lecture/${lecture._id}`)}
                  >
                    Watch →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No lectures available yet</p>
          )}
        </div>
      </div>
    </div>
  )
}






