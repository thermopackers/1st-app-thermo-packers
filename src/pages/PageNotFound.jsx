import React from 'react';
import { Link } from 'react-router-dom';
import InternalNavbar from '../components/InternalNavbar';

const PageNotFound = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-md mx-auto">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-9xl font-bold text-red-600 mb-4">404</div>
            <div className="w-32 h-32 mx-auto mb-4">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                className="w-full h-full text-red-500"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
          
          {/* Message */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered an incorrect URL.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/" 
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition duration-200 font-medium"
            >
              Go Home
            </Link>
            
            <button 
              onClick={() => window.history.back()} 
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition duration-200 font-medium"
            >
              Go Back
            </button>
          </div>
          
          {/* Additional Help */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              If you believe this is an error, please contact the administrator or check the URL again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;