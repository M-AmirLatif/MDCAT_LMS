import { Component } from 'react'
import { clearApiCache } from '../services/queryClient'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Structured log so a single screenshot or console export can diagnose the crash.
    console.error('ErrorBoundary caught:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      buildId: import.meta.env.VITE_BUILD_ID || 'dev',
      url: window.location.href,
    })
  }

  handleClearCacheReload = () => {
    try { clearApiCache() } catch { /* ignore */ }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const errorHint = String(this.state.error?.message || '').slice(0, 120)

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '60px',
            lineHeight: 1,
          }}>⚠️</div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '28px',
            color: '#e2e8f0',
          }}>Something went wrong</h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '15px',
            maxWidth: '400px',
          }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {errorHint && (
            <p style={{
              color: '#64748b',
              fontSize: '12px',
              maxWidth: '480px',
              fontFamily: 'monospace',
              wordBreak: 'break-word',
            }}>
              {errorHint}
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #34d399)',
                color: '#fff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={this.handleClearCacheReload}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                padding: '12px 28px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Clear Cache &amp; Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
