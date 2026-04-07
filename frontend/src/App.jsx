import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import LecturePlayer from './pages/LecturePlayer'
import CreateLecture from './pages/CreateLecture'
import MCQTest from './pages/MCQTest'
import CreateMCQ from './pages/CreateMCQ'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:courseId" element={<CourseDetail />} />
        <Route path="/lecture/:lectureId" element={<LecturePlayer />} />
        <Route
          path="/course/:courseId/create-lecture"
          element={<CreateLecture />}
        />
        <Route path="/course/:courseId/mcqs" element={<MCQTest />} />
        <Route path="/course/:courseId/create-mcq" element={<CreateMCQ />} />
      </Routes>
    </Router>
  )
}

export default App
