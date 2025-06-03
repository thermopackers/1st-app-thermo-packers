// src/components/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/'); // Redirect to the home page or login page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 px-4">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-4 text-xl text-gray-600">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="mt-6">
          <button
            onClick={handleRedirect}
            className="bg-red-600 text-white py-2 px-6 rounded-lg shadow-md hover:bg-red-700 transition-all duration-300"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
