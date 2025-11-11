import React from 'react';

const PaginationButton = ({ onClick, disabled, isActive, label }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 
      ${isActive 
        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg scale-110" 
        : disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
  >
    {label}
  </button>
);

export default PaginationButton;