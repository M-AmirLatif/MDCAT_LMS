import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'
import { queryClient } from './services/queryClient'

function ToasterWithTheme() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          fontSize: '14px',
        },
      }}
    />
  )
}

// Log build info so it's trivially verifiable from DevTools whether latest deploy is live
console.info(
  `%c[MDCAT LMS]%c Build ${import.meta.env.VITE_BUILD_ID || 'dev'} · ${import.meta.env.VITE_BUILD_TIME || 'local'}`,
  'color: #7c5cff; font-weight: bold',
  'color: inherit',
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <ToasterWithTheme />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
