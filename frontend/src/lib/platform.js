export const ROLE_LABELS = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
  superadmin: 'Super Admin',
}

export const ROLE_BADGE_CLASSES = {
  student: 'badge-purple',
  teacher: 'badge-teal',
  admin: 'badge-amber',
  superadmin: 'badge-coral',
}

export const DEFAULT_ROUTE_BY_ROLE = {
  student: '/dashboard',
  teacher: '/dashboard',
  admin: '/dashboard',
  superadmin: '/dashboard',
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
        { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { key: 'students', label: 'Manage Students', path: '/admin/students', icon: 'students' },
        { key: 'teachers', label: 'Manage Teachers', path: '/admin/teachers', icon: 'teachers' },
        { key: 'courses', label: 'Manage MCQ Bank', path: '/admin/courses', icon: 'courses' },
        { key: 'payments', label: 'Platform Statistics', path: '/admin/payments', icon: 'payments' },
        { key: 'announcements', label: 'Announcements', path: '/admin/announcements', icon: 'announcements' },
        { key: 'reports', label: 'Reports', path: '/admin/reports', icon: 'reports' },
        { key: 'settings', label: 'Settings', path: '/admin/settings', icon: 'settings' },
      ],
    },
  ],
  superadmin: [
    {
      label: 'Control',
      items: [
        { key: 'dashboard', label: 'Control Center', path: '/dashboard', icon: 'dashboard' },
        { key: 'admins', label: 'Manage Admins', path: '/super-admin/admins', icon: 'admins' },
        { key: 'platform', label: 'Platform Settings', path: '/super-admin/platform-settings', icon: 'settings' },
        { key: 'logs', label: 'System Logs', path: '/super-admin/logs', icon: 'logs' },
        { key: 'danger', label: 'Danger Zone', path: '/super-admin/danger-zone', icon: 'danger' },
        { key: 'payments', label: 'Payments', path: '/super-admin/payments', icon: 'payments' },
        { key: 'announcements', label: 'Announcements', path: '/super-admin/announcements', icon: 'announcements' },
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

  return role === 'superadmin' ? 'Control Center' : 'MDCAT LMS'
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
