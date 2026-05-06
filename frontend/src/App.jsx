import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import './pages/PlatformPages.css'
import './theme.css'

// ==================== LAZY ROUTE IMPORTS ====================
// Each page is loaded only when its route is visited, splitting the initial
// bundle from ~one mega-chunk into per-route chunks.  Recharts, McqModule,
// and role-specific pages are the biggest wins — they stay out of the
// critical path until actually needed.

const AppLayout = lazy(() => import('./components/layout/AppLayout'))
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const SetPassword = lazy(() => import('./pages/SetPassword'))

// Platform pages (authenticated)
const PlatformDashboard = lazy(() => import('./pages/PlatformDashboard'))
const PlatformPerformance = lazy(() => import('./pages/PlatformPerformance'))
const PlatformLiveClasses = lazy(() => import('./pages/PlatformLiveClasses'))
const PlatformPayments = lazy(() => import('./pages/PlatformPayments'))
const PlatformNotifications = lazy(() => import('./pages/PlatformNotifications'))
const PlatformProfile = lazy(() => import('./pages/PlatformProfile'))

// Individual course/lecture/test pages
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const LecturePlayer = lazy(() => import('./pages/LecturePlayer'))
const MCQTest = lazy(() => import('./pages/MCQTest'))
const TestReview = lazy(() => import('./pages/TestReview'))
const NotFound = lazy(() => import('./pages/NotFound'))

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
const LazyMcqCourseSelection = lazy(() =>
  import('./pages/McqModule').then((m) => ({ default: m.CourseSelection })),
)
const LazyMcqChapterList = lazy(() =>
  import('./pages/McqModule').then((m) => ({ default: m.ChapterList })),
)
const LazyMcqMcqList = lazy(() =>
  import('./pages/McqModule').then((m) => ({ default: m.McqList })),
)
const LazyMcqQuizAttempt = lazy(() =>
  import('./pages/McqModule').then((m) => ({ default: m.QuizAttempt })),
)
const LazyMcqQuizResult = lazy(() =>
  import('./pages/McqModule').then((m) => ({ default: m.QuizResult })),
)

// Role pages lazy wrappers
const LazyAdminCoursesPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminCoursesPage })),
)
const LazyAdminStudentsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminStudentsPage })),
)
const LazyAdminTeachersPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminTeachersPage })),
)
const LazyAdminAnnouncementsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminAnnouncementsPage })),
)
const LazyAdminReportsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminReportsPage })),
)
const LazyAdminSettingsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.AdminSettingsPage })),
)
const LazyTeacherStudentsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.TeacherStudentsPage })),
)
const LazyTeacherAssignmentsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.TeacherAssignmentsPage })),
)
const LazyTeacherAnalyticsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.TeacherAnalyticsPage })),
)
const LazySuperAdminAdminsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.SuperAdminAdminsPage })),
)
const LazySuperAdminSettingsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.SuperAdminSettingsPage })),
)
const LazySuperAdminLogsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.SuperAdminLogsPage })),
)
const LazySuperAdminDangerZonePage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.SuperAdminDangerZonePage })),
)
const LazySuperAdminPaymentsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.SuperAdminPaymentsPage })),
)
const LazySuperAdminAnnouncementsPage = lazy(() =>
  import('./pages/PlatformRolePages').then((m) => ({ default: m.SuperAdminAnnouncementsPage })),
)

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
                <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                  <LazyMcqCourseSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/create"
              element={
                <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                  <LazyAdminCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/:courseId/edit"
              element={
                <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                  <LazyAdminCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                  <LazyTeacherStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments"
              element={
                <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                  <LazyTeacherAssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/analytics"
              element={
                <ProtectedRoute roles={['teacher', 'admin', 'superadmin']}>
                  <LazyTeacherAnalyticsPage />
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
                  <LazyAdminStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyAdminTeachersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyAdminCoursesPage />
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
                  <LazyAdminAnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyAdminReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyAdminSettingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/super-admin/admins"
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <LazySuperAdminAdminsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/platform-settings"
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <LazySuperAdminSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/logs"
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <LazySuperAdminLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/danger-zone"
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <LazySuperAdminDangerZonePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/payments"
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <LazySuperAdminPaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/announcements"
              element={
                <ProtectedRoute roles={['superadmin']}>
                  <LazySuperAdminAnnouncementsPage />
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
