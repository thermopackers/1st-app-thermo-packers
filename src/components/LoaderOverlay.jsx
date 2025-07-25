// LoaderOverlay.js
import React from 'react';

const LoaderOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-[#000000b0] bg-opacity-50 flex justify-center items-center z-50">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 border-solid rounded-full animate-spin"></div>
        <span className="text-white">Uploading...</span>
      </div>
    </div>
  );
};

export default LoaderOverlay;
