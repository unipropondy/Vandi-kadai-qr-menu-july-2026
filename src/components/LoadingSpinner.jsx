import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'small' }) => {
  return (
    <div className={`spinner ${size}`}>
      <div className="double-bounce1"></div>
      <div className="double-bounce2"></div>
    </div>
  );
};

export default LoadingSpinner;
