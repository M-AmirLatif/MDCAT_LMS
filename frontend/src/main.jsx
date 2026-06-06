import { StrictMode, useMemo, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

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
