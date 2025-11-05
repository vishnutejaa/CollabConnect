import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 50%, #80CBC4 100%)' }}>
          <div className="max-w-md p-8 rounded-3xl text-center" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(211, 47, 47, 0.1)' }}>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#004D40' }}>
              Something went wrong
            </h2>
            <p className="mb-6" style={{ color: '#00695C' }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              style={{ background: 'linear-gradient(135deg, #00897B, #26A69A)', color: 'white' }}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
