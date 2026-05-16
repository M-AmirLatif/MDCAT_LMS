import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import './pages/PlatformPages.css'
import './theme.css'

function lazyWithRetry(importer, key) {
  return lazy(async () => {
    try {
      const module = await importer()
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`lazy-retry:${key}`)
      }
      return module
    } catch (error) {
      const message = String(error?.message || '')
      const isChunkLoadError =
        /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(message)

      if (typeof window !== 'undefined' && isChunkLoadError) {
        const retryKey = `lazy-retry:${key}`
        const alreadyRetried = sessionStorage.getItem(retryKey) === '1'

        if (!alreadyRetried) {
          sessionStorage.setItem(retryKey, '1')
          window.location.reload()
          return new Promise(() => {})
        }

        sessionStorage.removeItem(retryKey)
      }

      throw error
    }
  })
}

// ==================== LAZY ROUTE IMPORTS ====================
// Each page is loaded only when its route is visited, splitting the initial
// bundle from ~one mega-chunk into per-route chunks.  Recharts, McqModule,
// and role-specific pages are the biggest wins — they stay out of the
// critical path until actually needed.

const AppLayout = lazyWithRetry(() => import('./components/layout/AppLayout'), 'AppLayout')
const Home = lazyWithRetry(() => import('./pages/Home'), 'Home')
const Login = lazyWithRetry(() => import('./pages/Login'), 'Login')
const Register = lazyWithRetry(() => import('./pages/Register'), 'Register')
const VerifyEmail = lazyWithRetry(() => import('./pages/VerifyEmail'), 'VerifyEmail')
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'), 'ForgotPassword')
const SetPassword = lazyWithRetry(() => import('./pages/SetPassword'), 'SetPassword')

// Platform pages (authenticated)
const PlatformDashboard = lazyWithRetry(() => import('./pages/PlatformDashboard'), 'PlatformDashboard')
const PlatformPerformance = lazyWithRetry(() => import('./pages/PlatformPerformance'), 'PlatformPerformance')
const PlatformLiveClasses = lazyWithRetry(() => import('./pages/PlatformLiveClasses'), 'PlatformLiveClasses')
const PlatformPayments = lazyWithRetry(() => import('./pages/PlatformPayments'), 'PlatformPayments')
const PlatformNotifications = lazyWithRetry(() => import('./pages/PlatformNotifications'), 'PlatformNotifications')
const PlatformProfile = lazyWithRetry(() => import('./pages/PlatformProfile'), 'PlatformProfile')

// Individual course/lecture/test pages
const CourseDetail = lazyWithRetry(() => import('./pages/CourseDetail'), 'CourseDetail')
const LecturePlayer = lazyWithRetry(() => import('./pages/LecturePlayer'), 'LecturePlayer')
const MCQTest = lazyWithRetry(() => import('./pages/MCQTest'), 'MCQTest')
const TestReview = lazyWithRetry(() => import('./pages/TestReview'), 'TestReview')
const NotFound = lazyWithRetry(() => import('./pages/NotFound'), 'NotFound')

// ==================== SUSPENSE FALLBACK ====================
function RouteFallback() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      Loading...
    </div>
  )
}

// ==================== PREFETCH HEAVY CHUNKS ====================
// After initial load, prefetch the two heaviest modules during browser idle time
// so navigation to MCQs / admin pages feels instant.
const prefetchMcqModule = () => import('./pages/McqModule')
const prefetchRolePages = () => import('./pages/PlatformRolePages')
if (typeof window !== 'undefined') {
  const idlePrefetch = () => {
    prefetchMcqModule()
    prefetchRolePages()
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(idlePrefetch, { timeout: 3000 })
  } else {
    setTimeout(idlePrefetch, 2000)
  }
}

// ==================== LAZY WRAPPERS ====================
// These resolve named exports from lazy-loaded modules so React.lazy can use them.
const LazyMcqCourseSelection = lazyWithRetry(() =>
  import('./pages/McqModule').then((m) => ({ default: m.CourseSelection })),
  'CourseSelection')
const LazyMcqChapterList = lazyWithRetry(() =>
  import('./pages/McqModule').then((m) => ({ default: m.ChapterList })),
  'ChapterList')
const LazyMcqMcqList = lazyWithRetry(() =>
  import('./pages/McqModule').then((m) => ({ default: m.McqList })),
  'McqList')
const LazyMcqQuizAttempt = lazyWithRetry(() =>
  import('./pages/McqModule').then((m) => ({ default: m.QuizAttempt })),
  'QuizAttempt')
const LazyMcqQuizResult = lazyWithRetry(() =>
  import('./pages/McqModule').then((m) => ({ default: m.QuizResult })),
  'QuizResult')

// Role pages lazy wrappers
const LazyAdminCoursesPage = lazyWithRetry(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminCoursesPage })),
  'AdminCoursesPage')
const LazyAdminStudentsPage = lazyWithRetry(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminStudentsPage })),
  'AdminStudentsPage')
const LazyAdminTeachersPage = lazyWithRetry(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminTeachersPage })),
  'AdminTeachersPage')
const LazyAdminAnnouncementsPage = lazyWithRetry(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminAnnouncementsPage })),
  'AdminAnnouncementsPage')
const LazyAdminReportsPage = lazyWithRetry(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminReportsPage })),
  'AdminReportsPage')
const LazyAdminSettingsPage = lazyWithRetry(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminSettingsPage })),
  'AdminSettingsPage')
const LazyTeacherStudentsPage = lazyWithRetry(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.TeacherStudentsPage })),
  'TeacherStudentsPage')
const LazyTeacherAnalyticsPage = lazyWithRetry(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.TeacherAnalyticsPage })),
  'TeacherAnalyticsPage')

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/set-password"
            element={
              <ProtectedRoute>
                <SetPassword />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<PlatformDashboard />} />
            <Route path="/courses" element={<LazyMcqCourseSelection />} />
            <Route path="/mcqs" element={<LazyMcqCourseSelection />} />
            <Route path="/student/mcqs" element={<LazyMcqCourseSelection />} />
            <Route path="/teacher/mcqs" element={<LazyMcqCourseSelection />} />
            <Route path="/mcqs/:subject" element={<LazyMcqChapterList />} />
            <Route path="/mcqs/:subject/:chapterId" element={<LazyMcqMcqList />} />
            <Route path="/mcqs/:subject/:chapterId/attempt" element={<LazyMcqQuizAttempt />} />
            <Route path="/mcqs/:subject/:chapterId/result" element={<LazyMcqQuizResult />} />
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
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <LazyMcqCourseSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/create"
              element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <LazyAdminCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/:courseId/edit"
              element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <LazyAdminCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <LazyTeacherStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments"
              element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <Navigate to="/teacher/mcqs" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/analytics"
              element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <LazyTeacherAnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <PlatformDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute roles={['admin']}>
                  <LazyAdminStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute roles={['admin']}>
                  <LazyAdminTeachersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute roles={['admin']}>
                  <LazyAdminCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute roles={['admin']}>
                  <PlatformPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <ProtectedRoute roles={['admin']}>
                  <LazyAdminAnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={['admin']}>
                  <LazyAdminReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute roles={['admin']}>
                  <LazyAdminSettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
