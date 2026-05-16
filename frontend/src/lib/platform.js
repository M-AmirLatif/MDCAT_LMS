export const ROLE_LABELS = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
}

export const ROLE_BADGE_CLASSES = {
  student: 'badge-purple',
  teacher: 'badge-teal',
  admin: 'badge-amber',
}

export const DEFAULT_ROUTE_BY_ROLE = {
  student: '/dashboard',
  teacher: '/dashboard',
  admin: '/dashboard',
}

export const PLATFORM_NAV = {
  student: [
    {
      label: 'Practice',
      items: [
        { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { key: 'courses', label: 'Practice Subjects', path: '/mcqs', icon: 'courses' },
        { key: 'performance', label: 'Performance', path: '/performance', icon: 'performance' },
        { key: 'notifications', label: 'Notifications', path: '/notifications', icon: 'notifications', badge: '3' },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { key: 'profile', label: 'Profile Settings', path: '/profile/edit', icon: 'profile' },
      ],
    },
  ],
  teacher: [
    {
      label: 'Management',
      items: [
        { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { key: 'my-courses', label: 'MCQ Management', path: '/teacher/mcqs', icon: 'courses' },
        { key: 'students', label: 'Student Attempts', path: '/teacher/students', icon: 'students' },
        { key: 'analytics', label: 'Performance Analytics', path: '/teacher/analytics', icon: 'analytics' },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { key: 'profile', label: 'Profile Settings', path: '/profile/edit', icon: 'profile' },
      ],
    },
  ],
  admin: [
    {
      label: 'Operations',
      items: [
        { key: 'dashboard', label: 'Admin Overview', path: '/dashboard', icon: 'dashboard' },
        { key: 'students', label: 'Students & Access', path: '/admin/students', icon: 'students' },
        { key: 'payments', label: 'Subscriptions & Payments', path: '/admin/payments', icon: 'payments' },
        { key: 'teachers', label: 'Teachers', path: '/admin/teachers', icon: 'teachers' },
        { key: 'courses', label: 'Content Moderation', path: '/admin/courses', icon: 'courses' },
      ],
    },
  ],
}

export function getRoleLabel(role = 'student') {
  return ROLE_LABELS[role] || ROLE_LABELS.student
}

export function getDefaultRouteForRole(role = 'student') {
  return DEFAULT_ROUTE_BY_ROLE[role] || DEFAULT_ROUTE_BY_ROLE.student
}

export function getNavigationForRole(role = 'student') {
  return PLATFORM_NAV[role] || PLATFORM_NAV.student
}

export function getPageTitle(pathname, role = 'student') {
  const sections = getNavigationForRole(role)
  for (const section of sections) {
    const match = section.items.find(
      (item) => pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)),
    )
    if (match) return match.label
  }

  if (pathname.startsWith('/course/') && pathname.includes('/create-lecture')) return 'Create Lecture'
  if (pathname.startsWith('/course/') && pathname.includes('/create-mcq')) return 'Create MCQ Bank'
  if (pathname.startsWith('/course/') && pathname.includes('/create-assignment')) return 'Create Assignment'
  if (pathname.startsWith('/course/') && pathname.includes('/assignments')) return 'Assignments'
  if (pathname.startsWith('/mcqs/') && pathname.includes('/attempt')) return 'Quiz Attempt'
  if (pathname.startsWith('/mcqs/') && pathname.includes('/result')) return 'Quiz Result'
  if (pathname.startsWith('/mcqs/')) return 'MCQ Bank'
  if (pathname === '/mcqs' || pathname === '/student/mcqs' || pathname === '/teacher/mcqs') return 'Practice Subjects'
  if (pathname.startsWith('/course/') && pathname.includes('/mcqs')) return 'Practice Test'
  if (pathname.startsWith('/course/')) return 'Subject Chapters'
  if (pathname.startsWith('/lecture/')) return 'Lecture Player'
  if (pathname.startsWith('/teacher/courses/') && pathname.includes('/edit')) return 'Edit Course'
  if (pathname.startsWith('/assignments/')) return 'Submission Review'
  if (pathname.startsWith('/test-review/')) return 'Test Review'

  return 'MDCAT LMS'
}

export function getMobileNavForRole(role = 'student') {
  if (role === 'student') {
    return [
      { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { key: 'courses', label: 'Subjects', path: '/mcqs', icon: 'courses' },
      { key: 'performance', label: 'Performance', path: '/performance', icon: 'performance' },
      { key: 'profile', label: 'Profile', path: '/profile/edit', icon: 'profile' },
      { key: 'notifications', label: 'Alerts', path: '/notifications', icon: 'notifications' },
    ]
  }

  const sections = getNavigationForRole(role)
  return sections.flatMap((section) => section.items).slice(0, 5)
}
