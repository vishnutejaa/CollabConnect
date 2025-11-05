import React from 'react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} border-teal-600 border-t-transparent rounded-full animate-spin`}></div>
      {text && <p className="mt-4 text-teal-700">{text}</p>}
    </div>
  );
};

export const FullPageLoader = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #B2DFDB 50%, #80CBC4 100%)' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-6 text-xl font-medium text-teal-800">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
