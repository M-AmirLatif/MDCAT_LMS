import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import './CourseDetail.css'

export default function CourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = getAuthUser()
  const isTeacher =
    user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'superadmin'

  useEffect(() => {
    fetchCourseAndLectures()
  }, [courseId])

  const fetchCourseAndLectures = async () => {
    try {
      if (courseId.startsWith('sample-')) {
        setCourse({
          _id: courseId,
          name: courseId === 'sample-bio' ? 'MDCAT Biology Foundations' : courseId === 'sample-chem' ? 'MDCAT Chemistry Numericals' : 'MDCAT Physics Sprint',
          category: courseId === 'sample-bio' ? 'Biology' : courseId === 'sample-chem' ? 'Chemistry' : 'Physics',
          description: 'This is a limited sample preview. Please log in and enroll to access full video lectures, complete MCQs, and track your progress.',
          topics: [{ name: 'Free Trial Scope', description: 'Observe the structure of our MDCAT courses' }],
          createdBy: { firstName: 'Expert', lastName: 'Instructors' },
          enrolledCount: 1205,
          isSample: true
        });
        setLectures([
          { _id: 'sample-lec-1', title: 'Sample Paper / Demo 1', topic: 'Preview', description: 'Preview snippet.', videoDuration: 300, views: 99 },
          { _id: 'sample-lec-2', title: 'Sample Paper / Demo 2', topic: 'Preview', description: 'Preview snippet.', videoDuration: 250, views: 42 }
        ]);
        setLoading(false);
        return;
      }

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
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/courses')}>Back to Courses</button>
      </div>
      <RoleTabs user={user} showGuest />

      <div className="course-detail-container">
        <div className="course-header">
          <div>
            <p className="label">Course</p>
            <h2>{course.name}</h2>
            <p className="category">{course.category}</p>
          </div>
          <div className="stats">
            <span>Students: {course.enrolledCount ?? course.enrolledStudents?.length ?? 0}</span>
            <span>Lectures: {lectures.length}</span>
          </div>
          <p className="description">{course.description}</p>
          <p className="instructor">
            Instructor: {course.createdBy?.firstName} {course.createdBy?.lastName}
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

        
        {course.isSample ? (
          <div className="assignment-section" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '12px' }}>
            <h3 style={{ color: '#8b5cf6' }}>Unlock Full Access</h3>
            <p style={{ marginTop: '8px' }}>Log in to access live assignments, real-time performance analytics, and dynamic tests.</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginTop: '16px' }}>Sign In Now</button>
          </div>
        ) : (
          <div className="assignment-section">
            <div className="assignment-header">
              <h3>Assignments</h3>
              <div className="assignment-actions">
                <button onClick={() => navigate(`/course/${courseId}/assignments`)}>
                  View Assignments
                </button>
                {isTeacher && (
                  <button
                    className="create-assignment-btn"
                    onClick={() => navigate(`/course/${courseId}/create-assignment`)}
                  >
                    Add Assignment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!course.isSample && (
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
        )}

        <div className="lectures-section">
          <div className="lectures-header">
            <h3>Lectures ({lectures.length})</h3>
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
                      <span>Views: {lecture.views}</span>
                      <span>Duration: {Math.floor(lecture.videoDuration / 60)}m</span>
                    </div>
                  </div>
                  <button
                    className={`watch-btn ${course.isSample ? 'locked' : ''}`}
                    onClick={() => course.isSample ? navigate('/login') : navigate(`/lecture/${lecture._id}`)}
                  >
                    {course.isSample ? 'Login to Open' : 'Watch'}
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


