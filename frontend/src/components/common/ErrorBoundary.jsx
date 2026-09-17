import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('sehatsetu_active_session');
    } catch (e) {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '1.5rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.925rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              A temporary issue occurred while displaying this page. You can reload the page or return to the login screen.
            </p>

            {this.state.error?.message && (
              <div style={{
                background: '#f1f5f9',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: '#475569',
                fontFamily: 'monospace',
                textAlign: 'left',
                marginBottom: '1.5rem',
                overflowX: 'auto'
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '10px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Home size={16} />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
