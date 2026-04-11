import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
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
        </div>
      )
    }

    return this.props.children
  }
}
