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
import Performance from './pages/Performance'
import TeacherCourses from './pages/TeacherCourses'
import CreateCourse from './pages/CreateCourse'
import EditCourse from './pages/EditCourse'
import AdminDashboard from './pages/AdminDashboard'
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
        <Route path="/performance" element={<Performance />} />
        <Route path="/teacher/courses" element={<TeacherCourses />} />
        <Route path="/teacher/courses/create" element={<CreateCourse />} />
        <Route path="/teacher/courses/:courseId/edit" element={<EditCourse />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
