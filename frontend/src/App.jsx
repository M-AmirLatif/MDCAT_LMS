import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import SetPassword from './pages/SetPassword'
import SampleTest from './pages/SampleTest'
import EditProfile from './pages/EditProfile'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import LecturePlayer from './pages/LecturePlayer'
import CreateLecture from './pages/CreateLecture'
import MCQTest from './pages/MCQTest'
import CreateMCQ from './pages/CreateMCQ'
import Performance from './pages/Performance'
import TestReview from './pages/TestReview'
import TeacherCourses from './pages/TeacherCourses'
import CreateCourse from './pages/CreateCourse'
import EditCourse from './pages/EditCourse'
import AdminDashboard from './pages/AdminDashboard'
import Assignments from './pages/Assignments'
import CreateAssignment from './pages/CreateAssignment'
import AssignmentSubmissions from './pages/AssignmentSubmissions'
import Notifications from './pages/Notifications'
import LiveSessions from './pages/LiveSessions'
import CreateLiveSession from './pages/CreateLiveSession'
import Payments from './pages/Payments'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public Routes (no sidebar) ── */}
        <Route path="/" element={<Home />} />
        <Route path="/sample-test" element={<SampleTest />} />
        <Route path="/sample-test/:subject" element={<SampleTest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Authenticated Routes (with sidebar layout) ── */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/lecture/:lectureId" element={<LecturePlayer />} />
          <Route
            path="/course/:courseId/create-lecture"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CreateLecture />
              </ProtectedRoute>
            }
          />
          <Route path="/course/:courseId/mcqs" element={<MCQTest />} />
          <Route
            path="/course/:courseId/create-mcq"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CreateMCQ />
              </ProtectedRoute>
            }
          />
          <Route path="/performance" element={<Performance />} />
          <Route path="/test-review/:sessionId" element={<TestReview />} />
          <Route
            path="/teacher/courses"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <TeacherCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/create"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CreateCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId/edit"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <EditCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/course/:courseId/assignments" element={<Assignments />} />
          <Route
            path="/course/:courseId/create-assignment"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CreateAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments/:assignmentId/submissions"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <AssignmentSubmissions />
              </ProtectedRoute>
            }
          />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/live-sessions" element={<LiveSessions />} />
          <Route
            path="/live-sessions/create"
            element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CreateLiveSession />
              </ProtectedRoute>
            }
          />
          <Route path="/payments" element={<Payments />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
