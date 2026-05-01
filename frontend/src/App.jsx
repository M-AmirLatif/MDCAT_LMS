import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ProtectedRoute from './components/ProtectedRoute'
import PlatformDashboard from './pages/PlatformDashboard'
import PlatformCourses from './pages/PlatformCourses'
import PlatformPerformance from './pages/PlatformPerformance'
import PlatformLiveClasses from './pages/PlatformLiveClasses'
import PlatformPayments from './pages/PlatformPayments'
import PlatformNotifications from './pages/PlatformNotifications'
import PlatformProfile from './pages/PlatformProfile'
import {
  AdminAnnouncementsPage,
  AdminCoursesPage,
  AdminReportsPage,
  AdminSettingsPage,
  AdminStudentsPage,
  AdminTeachersPage,
  SuperAdminAdminsPage,
  SuperAdminAnnouncementsPage,
  SuperAdminDangerZonePage,
  SuperAdminLogsPage,
  SuperAdminPaymentsPage,
  SuperAdminSettingsPage,
  TeacherAnalyticsPage,
  TeacherAssignmentsPage,
  TeacherStudentsPage,
} from './pages/PlatformRolePages'
import SampleTest from './pages/SampleTest'
import CourseDetail from './pages/CourseDetail'
import LecturePlayer from './pages/LecturePlayer'
import MCQTest from './pages/MCQTest'
import TestReview from './pages/TestReview'
import NotFound from './pages/NotFound'
import './App.css'
import './pages/PlatformPages.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sample-test" element={<SampleTest />} />
        <Route path="/sample-test/:subject" element={<SampleTest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<PlatformDashboard />} />
          <Route path="/courses" element={<PlatformCourses />} />
          <Route path="/performance" element={<PlatformPerformance />} />
          <Route path="/live-sessions" element={<PlatformLiveClasses />} />
          <Route path="/payments" element={<PlatformPayments />} />
          <Route path="/notifications" element={<PlatformNotifications />} />
          <Route path="/profile/edit" element={<PlatformProfile />} />

          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/lecture/:lectureId" element={<LecturePlayer />} />
          <Route path="/course/:courseId/mcqs" element={<MCQTest />} />
          <Route path="/test-review/:sessionId" element={<TestReview />} />

          <Route
            path="/teacher/courses"
            element={
              <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                <PlatformCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/create"
            element={
              <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId/edit"
            element={
              <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                <TeacherStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/assignments"
            element={
              <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                <TeacherAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/analytics"
            element={
              <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                <TeacherAnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <PlatformDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminTeachersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <PlatformPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminAnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin/admins"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <SuperAdminAdminsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/platform-settings"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <SuperAdminSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/logs"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <SuperAdminLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/danger-zone"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <SuperAdminDangerZonePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/payments"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <SuperAdminPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/announcements"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <SuperAdminAnnouncementsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
