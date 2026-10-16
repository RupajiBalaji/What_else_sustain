import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#F6F3E8',
            fontFamily: 'system-ui, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              background: '#FFFFFF',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(11,61,46,0.12)',
              border: '1.5px solid #D8D2C0',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '3rem' }}>🌱</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B3D2E' }}>
              Oops! A minor hiccup occurred.
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#4A6357', lineHeight: 1.45 }}>
              Don't worry — your progress is safely saved. Tap below to reload fresh.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: '#2E9E5B',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '9999px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              Restart Application 🔄
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
