import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../services/api'
import './AssignmentSubmissions.css'

export default function AssignmentSubmissions() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [grading, setGrading] = useState({})

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await API.get(`/assignments/${assignmentId}/submissions`)
        setAssignment(res.data.assignment)
      } catch (err) {
        setError('Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [assignmentId])

  const handleGradeChange = (studentId, field, value) => {
    setGrading((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value,
      },
    }))
  }

  const submitGrade = async (studentId) => {
    try {
      const payload = grading[studentId] || {}
      await API.put(`/assignments/${assignmentId}/grade`, {
        studentId,
        marks: payload.marks,
        feedback: payload.feedback,
      })
      const res = await API.get(`/assignments/${assignmentId}/submissions`)
      setAssignment(res.data.assignment)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to grade submission')
    }
  }

  if (loading)
    return (
      <div className="assignment-submissions">
        <p>Loading submissions...</p>
      </div>
    )

  if (!assignment) {
    return (
      <div className="assignment-submissions">
        <p>No assignment found.</p>
      </div>
    )
  }

  return (
    <div className="assignment-submissions">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="assignment-submissions-container">
        <h2>{assignment.title}</h2>
        {error && <p className="error-message">{error}</p>}

        {assignment.submissions.length === 0 ? (
          <p>No submissions yet.</p>
        ) : (
          <div className="submission-list">
            {assignment.submissions.map((submission) => (
              <div key={submission.studentId?._id || submission._id} className="submission-card">
                <div className="submission-header">
                  <div>
                    <h4>
                      {submission.studentId?.firstName} {submission.studentId?.lastName}
                    </h4>
                    <p>{submission.studentId?.email}</p>
                  </div>
                  <span>
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : ''}
                  </span>
                </div>

                {submission.fileUrl && (
                  <a href={submission.fileUrl} target="_blank" rel="noreferrer">
                    View File
                  </a>
                )}
                {submission.textAnswer && <p>{submission.textAnswer}</p>}

                <div className="grade-form">
                  <input
                    type="number"
                    placeholder="Marks"
                    value={grading[submission.studentId?._id]?.marks || ''}
                    onChange={(e) =>
                      handleGradeChange(submission.studentId?._id, 'marks', e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Feedback"
                    value={grading[submission.studentId?._id]?.feedback || ''}
                    onChange={(e) =>
                      handleGradeChange(submission.studentId?._id, 'feedback', e.target.value)
                    }
                  />
                  <button onClick={() => submitGrade(submission.studentId?._id)}>
                    Save Grade
                  </button>
                </div>

                {submission.marks !== null && (
                  <p className="graded">
                    Graded: {submission.marks} | {submission.feedback || 'No feedback'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
