import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthUser } from '../services/authStorage'
import './Assignments.css'

export default function Assignments() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submissions, setSubmissions] = useState({})
  const [uploadingId, setUploadingId] = useState(null)

  const user = getAuthUser()
  const isTeacher =
    user?.role === 'teacher' || user?.role === 'admin'

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await API.get(`/assignments/course/${courseId}`)
        setAssignments(res.data.assignments || [])
      } catch (err) {
        setError('Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [courseId])

  const uploadFile = async (file) => {
    const data = new FormData()
    data.append('file', file)
    const res = await API.post('/uploads/single', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }

  const handleInputChange = (assignmentId, field, value) => {
    setSubmissions((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || {}),
        [field]: value,
      },
    }))
  }

  const handleFileUpload = async (assignmentId, file) => {
    if (!file) return
    try {
      setUploadingId(assignmentId)
      const uploaded = await uploadFile(file)
      handleInputChange(assignmentId, 'fileUrl', uploaded.fileUrl)
      handleInputChange(assignmentId, 'fileName', uploaded.fileName)
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploadingId(null)
    }
  }

  const handleSubmit = async (assignmentId) => {
    try {
      const payload = submissions[assignmentId] || {}
      await API.post(`/assignments/${assignmentId}/submit`, payload)
      alert('Assignment submitted')
      const res = await API.get(`/assignments/course/${courseId}`)
      setAssignments(res.data.assignments || [])
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit assignment')
    }
  }

  if (loading)
    return (
      <div className="page-content">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading assignments...</p>
        </div>
      </div>
    )

  return (
    <div className="assignments">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
      <RoleTabs user={user} />

      <div className="assignments-container">
        <div className="header-row">
          <div>
            <h2>Assignments</h2>
            <p>Complete tasks and submit before the due date.</p>
          </div>
          {isTeacher && (
            <button onClick={() => navigate(`/course/${courseId}/create-assignment`)}>
              Create Assignment
            </button>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        {assignments.length === 0 ? (
          <p>No assignments yet.</p>
        ) : (
          <div className="assignment-list">
            {assignments.map((assignment) => {
              const mySubmission = assignment.submissions?.[0]
              return (
                <div key={assignment._id} className="assignment-card">
                  <div className="assignment-header">
                    <div>
                      <h3>{assignment.title}</h3>
                      <p className="meta">
                        Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}
                      </p>
                    </div>
                    <span className="marks">Max: {assignment.maxMarks}</span>
                  </div>
                  <p className="description">{assignment.description}</p>
                  {assignment.instructions && (
                    <p className="instructions">{assignment.instructions}</p>
                  )}
                  {assignment.attachments?.length > 0 && (
                    <div className="attachments">
                      {assignment.attachments.map((file, idx) => (
                        <a key={`${file.fileUrl}-${idx}`} href={file.fileUrl} target="_blank" rel="noreferrer">
                          {file.fileName}
                        </a>
                      ))}
                    </div>
                  )}

                  {isTeacher ? (
                    <div className="teacher-actions">
                      <button
                        onClick={() => navigate(`/assignments/${assignment._id}/submissions`)}
                      >
                        View Submissions
                      </button>
                    </div>
                  ) : (
                    <div className="student-submit">
                      {mySubmission ? (
                        <p className="submitted">Submitted</p>
                      ) : (
                        <>
                          <input
                            type="file"
                            onChange={(e) =>
                              handleFileUpload(assignment._id, e.target.files?.[0])
                            }
                          />
                          {uploadingId === assignment._id && (
                            <span className="upload-status">Uploading...</span>
                          )}
                          {submissions[assignment._id]?.fileName && (
                            <span className="upload-status">
                              Uploaded: {submissions[assignment._id]?.fileName}
                            </span>
                          )}
                          <textarea
                            rows="3"
                            placeholder="Write your answer (optional)"
                            value={submissions[assignment._id]?.textAnswer || ''}
                            onChange={(e) =>
                              handleInputChange(assignment._id, 'textAnswer', e.target.value)
                            }
                          ></textarea>
                          <button
                            onClick={() => handleSubmit(assignment._id)}
                            disabled={uploadingId === assignment._id}
                          >
                            Submit Assignment
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
