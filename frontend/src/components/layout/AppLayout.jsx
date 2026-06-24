import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './AppLayout.css'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mdcat_sidebar_collapsed') === '1'
    } catch {
      return false
    }
  })
  const location = useLocation()
  const contentRef = useRef(null)

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)
  const toggleCollapse = () => setSidebarCollapsed((prev) => !prev)

  useEffect(() => {
    try {
      localStorage.setItem('mdcat_sidebar_collapsed', sidebarCollapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    closeSidebar()
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  const layoutClass = useMemo(() => {
    const classes = ['app-layout']
    if (sidebarCollapsed) classes.push('app-layout--collapsed')
    return classes.join(' ')
  }, [sidebarCollapsed])

  return (
    <div className={layoutClass}>
      <a href="#app-content" className="skip-to-main">
        Skip to main content
      </a>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        currentPath={location.pathname}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <div className="app-main">
        <Topbar onMenuClick={toggleSidebar} />
        <main className="app-content" id="app-content" ref={contentRef}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
