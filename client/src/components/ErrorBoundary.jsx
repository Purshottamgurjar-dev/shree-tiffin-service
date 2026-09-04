import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#faf7f2',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '36px',
            boxShadow: '0 12px 36px rgba(44, 30, 16, 0.08)',
            border: '1px solid #eddccb',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(250, 82, 82, 0.1)',
              color: '#fa5252',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <AlertTriangle size={30} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1c1917', marginBottom: '8px' }}>
              Something Went Wrong
            </h2>

            <p style={{ fontSize: '14px', color: '#57534e', lineHeight: 1.6, marginBottom: '20px' }}>
              A temporary display error occurred while rendering the page. Please reload the application or return to home.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#f4ede4',
                padding: '12px 16px',
                borderRadius: '10px',
                color: '#d9480f',
                fontSize: '12.5px',
                fontFamily: 'monospace',
                textAlign: 'left',
                marginBottom: '24px',
                wordBreak: 'break-word',
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  backgroundColor: '#e8590c',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} />
                <span>Reload Page</span>
              </button>

              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  color: '#1c1917',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: '1.5px solid #eddccb',
                  textDecoration: 'none',
                }}
              >
                <Home size={15} />
                <span>Go to Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
