import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container my-5">
          <div className="alert alert-danger" role="alert">
            <h4>Something went wrong.</h4>
            <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <p>Please try refreshing the page or contact support.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;