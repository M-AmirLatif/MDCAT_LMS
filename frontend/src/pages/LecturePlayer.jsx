import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import './LecturePlayer.css'

export default function LecturePlayer() {
  const { lectureId } = useParams()
  const [lecture, setLecture] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    fetchLecture()
  }, [lectureId])

  const fetchLecture = async () => {
    try {
      const res = await API.get(`/lectures/${lectureId}`)
      setLecture(res.data.lecture)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="lecture-player">
        <p>Loading...</p>
      </div>
    )

  if (!lecture)
    return (
      <div className="lecture-player">
        <p>Lecture not found</p>
      </div>
    )

  return (
    <div className="lecture-player">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
      <RoleTabs user={user} showGuest />

      <div className="player-container">
        <div className="video-section">
          <video width="100%" height="500" controls autoPlay>
            <source src={lecture.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="lecture-info-section">
          <h2>{lecture.title}</h2>
          <p className="topic">Topic: {lecture.topic}</p>
          <p className="instructor">
            By: {lecture.uploadedBy?.firstName} {lecture.uploadedBy?.lastName}
          </p>

          <div className="stats">
            <span>Views: {lecture.views}</span>
            <span>
              Duration: {Math.floor(lecture.videoDuration / 60)}m{' '}
              {lecture.videoDuration % 60}s
            </span>
            <span>
              Date: {new Date(lecture.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="description-section">
            <h3>Description</h3>
            <p>{lecture.description}</p>
          </div>

          {lecture.notes && (
            <div className="notes-section">
              <h3>Notes</h3>
              <p>{lecture.notes}</p>
            </div>
          )}

          {lecture.attachments?.length > 0 && (
            <div className="attachments-section">
              <h3>Attachments</h3>
              <ul>
                {lecture.attachments.map((attachment, idx) => (
                  <li key={idx}>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {attachment.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

