import { StrictMode, useMemo, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

function ToasterWithTheme() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const saved = localStorage.getItem('mdcat-theme') || 'light'
    setTheme(saved)

    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      setTheme(currentTheme)
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  const toastStyle = useMemo(() => {
    if (theme === 'dark') {
      return {
        background: '#12102A',
        color: '#F0EEFF',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }
    }
    return {
      background: '#FAFAFC',
      color: '#1A1A2E',
      border: '1px solid rgba(15, 23, 42, 0.08)',
    }
  }, [theme])

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          ...toastStyle,
          borderRadius: '12px',
          fontSize: '14px',
        },
      }}
    />
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <ToasterWithTheme />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
