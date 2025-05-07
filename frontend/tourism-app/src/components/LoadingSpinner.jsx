import React from 'react';
import './loadingSpinner.css';

// Debug: Confirm component is defined
console.log('LoadingSpinner component loaded');

const LoadingSpinner = () => (
  <div className="d-flex justify-content-center my-5">
    <div className="spinner-border text-info" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Debug: Confirm export
console.log('Exporting LoadingSpinner:', LoadingSpinner, typeof LoadingSpinner);

export default LoadingSpinner;