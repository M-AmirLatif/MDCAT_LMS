import { useEffect, useMemo, useState } from 'react'
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

  const layoutClass = useMemo(
    () => `app-layout ${sidebarCollapsed ? 'app-layout--collapsed' : ''}`.trim(),
    [sidebarCollapsed],
  )

  return (
    <div className={layoutClass}>
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
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
