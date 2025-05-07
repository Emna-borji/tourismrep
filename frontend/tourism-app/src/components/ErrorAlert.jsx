import React from 'react';
import './errorAlert.css';

// Debug: Confirm component is defined
console.log('ErrorAlert component loaded');

const ErrorAlert = ({ error }) => (
  <div className="container my-4">
    <div className="alert alert-danger" role="alert">
      Error: {error}
    </div>
  </div>
);

// Debug: Confirm export
console.log('Exporting ErrorAlert:', ErrorAlert, typeof ErrorAlert);

export default ErrorAlert;